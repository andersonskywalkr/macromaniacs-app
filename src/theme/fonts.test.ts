import {
  FONT_FAMILY_BY_WEIGHT,
  FONT_FILES,
  FONT_LOAD_TIMEOUT_MS,
  fontFamily,
} from './fonts';

describe('fontFamily', () => {
  it('has one family name per weight of the prototype (plus 400 for body text)', () => {
    expect(fontFamily(400)).toBe('PlusJakartaSans_400Regular');
    expect(fontFamily(500)).toBe('PlusJakartaSans_500Medium');
    expect(fontFamily(600)).toBe('PlusJakartaSans_600SemiBold');
    expect(fontFamily(700)).toBe('PlusJakartaSans_700Bold');
    expect(fontFamily(800)).toBe('PlusJakartaSans_800ExtraBold');
  });

  it('defaults to the regular weight', () => {
    expect(fontFamily()).toBe(FONT_FAMILY_BY_WEIGHT[400]);
  });

  it('falls back to the closest available weight', () => {
    expect(fontFamily(300)).toBe(FONT_FAMILY_BY_WEIGHT[400]);
    expect(fontFamily(900)).toBe(FONT_FAMILY_BY_WEIGHT[800]);
    expect(fontFamily(650)).toBe(FONT_FAMILY_BY_WEIGHT[600]);
  });

  it('gives every family a font file to load', () => {
    expect(Object.keys(FONT_FILES).sort()).toEqual(Object.values(FONT_FAMILY_BY_WEIGHT).sort());
  });

  it('limits the splash wait to about 3 seconds', () => {
    expect(FONT_LOAD_TIMEOUT_MS).toBe(3000);
  });
});
