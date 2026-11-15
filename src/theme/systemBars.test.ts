import { Appearance } from 'react-native';
import { colors } from './tokens';
import {
  getSystemBarsStyle,
  nativeColorSchemeFor,
  resolveThemeMode,
  syncNativeColorScheme,
} from './systemBars';

describe('getSystemBarsStyle (decided by the APP theme)', () => {
  it('light app background -> dark icons', () => {
    expect(getSystemBarsStyle('light')).toEqual({
      statusBarStyle: 'dark',
      navigationBarStyle: 'dark',
      backgroundColor: colors.light.background,
    });
  });

  it('dark app background -> light icons', () => {
    expect(getSystemBarsStyle('dark')).toEqual({
      statusBarStyle: 'light',
      navigationBarStyle: 'light',
      backgroundColor: colors.dark.background,
    });
  });

  it('the icons always contrast with the background (never light on light or dark on dark)', () => {
    for (const mode of ['light', 'dark'] as const) {
      const { statusBarStyle, navigationBarStyle } = getSystemBarsStyle(mode);
      const expected = mode === 'light' ? 'dark' : 'light';
      expect(statusBarStyle).toBe(expected);
      expect(navigationBarStyle).toBe(expected);
    }
  });
});

describe('resolveThemeMode', () => {
  it('uses the chosen theme, whatever the system theme is', () => {
    for (const system of ['light', 'dark', 'unspecified', null, undefined] as const) {
      expect(resolveThemeMode('light', system)).toBe('light');
      expect(resolveThemeMode('dark', system)).toBe('dark');
    }
  });

  it('follows the system theme only in "system" mode (unknown counts as light)', () => {
    expect(resolveThemeMode('system', 'dark')).toBe('dark');
    expect(resolveThemeMode('system', 'light')).toBe('light');
    expect(resolveThemeMode('system', 'unspecified')).toBe('light');
    expect(resolveThemeMode('system', null)).toBe('light');
    expect(resolveThemeMode('system', undefined)).toBe('light');
  });
});

describe('native color scheme', () => {
  it('asks the system for the chosen theme, or to follow it', () => {
    expect(nativeColorSchemeFor('light')).toBe('light');
    expect(nativeColorSchemeFor('dark')).toBe('dark');
    expect(nativeColorSchemeFor('system')).toBe('unspecified');
  });

  it('applies it with Appearance.setColorScheme and survives an environment without the native module', () => {
    const spy = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
    syncNativeColorScheme('dark');
    expect(spy).toHaveBeenCalledWith('dark');

    spy.mockImplementation(() => {
      throw new Error('sem módulo nativo');
    });
    expect(() => syncNativeColorScheme('light')).not.toThrow();
    spy.mockRestore();
  });
});
