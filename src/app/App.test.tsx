import React from 'react';
import { act, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import App from './App';

let mockFontsState: [boolean, Error | null] = [false, null];

jest.mock('expo-font', () => ({
  useFonts: () => mockFontsState,
}));
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve(true)),
  hideAsync: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@expo-google-fonts/plus-jakarta-sans', () => ({
  PlusJakartaSans_400Regular: 1,
  PlusJakartaSans_500Medium: 2,
  PlusJakartaSans_600SemiBold: 3,
  PlusJakartaSans_700Bold: 4,
  PlusJakartaSans_800ExtraBold: 5,
}));
jest.mock('@/navigation/RootNavigator', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { Text: MockText } = jest.requireActual<typeof import('react-native')>('react-native');
  return { RootNavigator: () => ReactModule.createElement(MockText, null, 'APP_READY') };
});
// O SafeAreaProvider real só renderiza depois de medir a tela (nativo).
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/offline/sync', () => ({ startOfflineSync: () => () => undefined }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(),
  },
}));

describe('App fonts and splash', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockFontsState = [false, null];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('holds the splash (renders nothing) while the fonts load', () => {
    const screen = render(<App />);

    expect(screen.queryByText('APP_READY')).toBeNull();
    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  });

  it('opens the app and hides the splash as soon as the fonts load', () => {
    mockFontsState = [true, null];
    const screen = render(<App />);

    expect(screen.getByText('APP_READY')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('opens with the system font if the fonts fail', () => {
    mockFontsState = [false, new Error('falhou')];
    const screen = render(<App />);

    expect(screen.getByText('APP_READY')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  it('does not hang if the fonts take longer than the timeout', () => {
    const screen = render(<App />);
    expect(screen.queryByText('APP_READY')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(3100);
    });

    expect(screen.getByText('APP_READY')).toBeTruthy();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });
});
