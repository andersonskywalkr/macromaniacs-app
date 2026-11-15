import React from 'react';
import { Appearance, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from './ThemeProvider';
import { AppSystemBars, ThemedRoot } from './AppSystemBars';
import { colors } from './tokens';
import { useThemeStore } from '@/store/themeStore';

let mockSystemScheme: 'light' | 'dark' | 'unspecified' | null = 'light';
const mockStatusBar = jest.fn();

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockSystemScheme,
}));
jest.mock('expo-status-bar', () => ({
  StatusBar: (props: { style?: string }) => {
    mockStatusBar(props);
    return null;
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(),
  },
}));

const lastStyle = () => mockStatusBar.mock.calls[mockStatusBar.mock.calls.length - 1][0].style;

function renderBars(preference: 'light' | 'dark' | 'system', system: typeof mockSystemScheme) {
  mockSystemScheme = system;
  useThemeStore.setState({ preference });
  return render(
    <ThemeProvider>
      <AppSystemBars />
    </ThemeProvider>,
  );
}

describe('AppSystemBars: status bar icons follow the APP theme, never "auto"', () => {
  let setColorScheme: jest.SpyInstance;

  beforeEach(() => {
    mockStatusBar.mockClear();
    setColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
  });

  afterEach(() => {
    setColorScheme.mockRestore();
  });

  // [tema do app, tema do sistema, ícones esperados]
  it.each([
    ['light', 'light', 'dark'],
    ['light', 'dark', 'dark'], // o caso do bug: antes "auto" dava ícones claros sobre fundo claro
    ['dark', 'light', 'light'], // antes: ícones escuros sobre fundo escuro
    ['dark', 'dark', 'light'],
  ] as const)('app %s + system %s -> %s icons', (app, system, expected) => {
    renderBars(app, system);
    expect(lastStyle()).toBe(expected);
  });

  it.each([
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const)('"system" preference follows the system theme (%s -> %s icons)', (system, expected) => {
    renderBars('system', system);
    expect(lastStyle()).toBe(expected);
  });

  it('never uses "auto"', () => {
    for (const preference of ['light', 'dark', 'system'] as const) {
      renderBars(preference, 'dark');
    }
    for (const [props] of mockStatusBar.mock.calls) expect(props.style).not.toBe('auto');
  });

  it('reacts to a theme change with the app open', () => {
    renderBars('light', 'dark');
    expect(lastStyle()).toBe('dark');

    act(() => {
      useThemeStore.getState().setPreference('dark');
    });
    expect(lastStyle()).toBe('light');

    act(() => {
      useThemeStore.getState().setPreference('light');
    });
    expect(lastStyle()).toBe('dark');
  });

  it('in "system" mode follows a system theme change with the app open', () => {
    const view = renderBars('system', 'light');
    expect(lastStyle()).toBe('dark');

    mockSystemScheme = 'dark';
    view.rerender(
      <ThemeProvider>
        <AppSystemBars />
      </ThemeProvider>,
    );
    expect(lastStyle()).toBe('light');
  });

  it('asks the native layer for the chosen theme (so nav bar buttons and dialogs follow the app)', () => {
    renderBars('light', 'dark');
    expect(setColorScheme).toHaveBeenLastCalledWith('light');

    act(() => {
      useThemeStore.getState().setPreference('dark');
    });
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');

    act(() => {
      useThemeStore.getState().setPreference('system');
    });
    expect(setColorScheme).toHaveBeenLastCalledWith('unspecified');
  });
});

describe('ThemedRoot', () => {
  beforeEach(() => {
    mockStatusBar.mockClear();
    jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
  });

  it.each([
    ['light', colors.light.background],
    ['dark', colors.dark.background],
  ] as const)('fills the whole screen with the %s theme background', (mode, background) => {
    mockSystemScheme = mode === 'light' ? 'dark' : 'light'; // sistema no tema oposto
    useThemeStore.setState({ preference: mode });
    render(
      <ThemeProvider>
        <ThemedRoot>
          <Text>conteúdo</Text>
        </ThemedRoot>
      </ThemeProvider>,
    );

    const root = screen.toJSON() as { props: { style: unknown } };
    const style = Object.assign({}, ...[root.props.style].flat(5));
    expect(style.backgroundColor).toBe(background);
    expect(style.flex).toBe(1);
    expect(screen.getByText('conteúdo')).toBeTruthy();
    expect(lastStyle()).toBe(mode === 'light' ? 'dark' : 'light');
  });
});
