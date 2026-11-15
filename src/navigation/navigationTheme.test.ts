import { colors } from '@/theme/tokens';
import { buildNavigationTheme } from './navigationTheme';

describe('buildNavigationTheme', () => {
  it.each(['light', 'dark'] as const)('uses the %s tokens (no fixed light grey behind the screens)', (mode) => {
    const theme = buildNavigationTheme(mode, colors[mode]);

    expect(theme.dark).toBe(mode === 'dark');
    expect(theme.colors.background).toBe(colors[mode].background);
    expect(theme.colors.card).toBe(colors[mode].background);
    expect(theme.colors.text).toBe(colors[mode].text);
    expect(theme.colors.primary).toBe(colors[mode].primary);
  });

  it('keeps the other fields of the base theme (fonts)', () => {
    expect(buildNavigationTheme('dark', colors.dark).fonts).toBeDefined();
  });
});
