import { schema } from '@dicebear/avataaars';
import {
  ACCESSORIES_COLORS,
  ACCESSORY_VALUES,
  AVATAR_CONFIG_VERSION,
  BACKGROUND_COLORS,
  CLOTHES_COLORS,
  CLOTHING_GRAPHIC_VALUES,
  CLOTHING_VALUES,
  DEFAULT_AVATAR_OPTIONS,
  EYEBROWS_VALUES,
  EYES_VALUES,
  FACIAL_HAIR_COLORS,
  FACIAL_HAIR_VALUES,
  HAIR_COLORS,
  HAT_COLORS,
  HAT_TOP_VALUES,
  MOUTH_VALUES,
  SKIN_COLORS,
  TOP_VALUES,
  avatarStorageKey,
  defaultAvatarConfig,
  isHatTop,
  parseStoredAvatarConfig,
  randomAvatarConfig,
  sameAvatarConfig,
  sanitizeAvatarConfig,
  sanitizeAvatarOptions,
} from './avatarConfig';

type SchemaProp = { items?: { enum?: string[] }; default?: unknown };
const props = (schema as unknown as { properties: Record<string, SchemaProp> }).properties;
const enumOf = (name: string) => props[name].items?.enum;
const defaultOf = (name: string) => props[name].default;

describe('constants match the installed @dicebear/avataaars schema', () => {
  it.each([
    ['top', TOP_VALUES],
    ['clothing', CLOTHING_VALUES],
    ['clothingGraphic', CLOTHING_GRAPHIC_VALUES],
    ['accessories', ACCESSORY_VALUES],
    ['eyes', EYES_VALUES],
    ['eyebrows', EYEBROWS_VALUES],
    ['mouth', MOUTH_VALUES],
    ['facialHair', FACIAL_HAIR_VALUES],
  ])('%s has exactly the schema values', (name, values) => {
    expect([...values]).toEqual(enumOf(name));
  });

  it.each([
    ['skinColor', SKIN_COLORS],
    ['hairColor', HAIR_COLORS],
    ['facialHairColor', FACIAL_HAIR_COLORS],
    ['hatColor', HAT_COLORS],
    ['accessoriesColor', ACCESSORIES_COLORS],
    ['clothesColor', CLOTHES_COLORS],
  ])('%s palette is the style default palette', (name, colors) => {
    expect([...colors]).toEqual(defaultOf(name));
  });

  it('knows the sizes from the spec (34 tops, 9 clothes, 7 accessories, 5 beards)', () => {
    expect(TOP_VALUES).toHaveLength(34);
    expect(CLOTHING_VALUES).toHaveLength(9);
    expect(ACCESSORY_VALUES).toHaveLength(7);
    expect(FACIAL_HAIR_VALUES).toHaveLength(5);
  });

  it('treats hats and veils as hat tops (they use hatColor)', () => {
    expect([...HAT_TOP_VALUES]).toEqual([
      'hat',
      'hijab',
      'turban',
      'winterHat1',
      'winterHat02',
      'winterHat03',
      'winterHat04',
    ]);
    for (const top of HAT_TOP_VALUES) expect(isHatTop(top)).toBe(true);
    expect(isHatTop('shortFlat')).toBe(false);
    expect(isHatTop(null)).toBe(false);
  });

  it('keeps the background palette valid (hex or transparent)', () => {
    for (const color of BACKGROUND_COLORS) expect(color).toMatch(/^(transparent|[a-f0-9]{6})$/);
    expect(BACKGROUND_COLORS).toContain('transparent');
  });

  it('has a valid default combination', () => {
    expect(sanitizeAvatarOptions(DEFAULT_AVATAR_OPTIONS)).toEqual(DEFAULT_AVATAR_OPTIONS);
  });
});

describe('sanitizeAvatarOptions', () => {
  it('returns the default for anything that is not an object', () => {
    expect(sanitizeAvatarOptions(null)).toEqual(DEFAULT_AVATAR_OPTIONS);
    expect(sanitizeAvatarOptions('x')).toEqual(DEFAULT_AVATAR_OPTIONS);
    expect(sanitizeAvatarOptions(42)).toEqual(DEFAULT_AVATAR_OPTIONS);
  });

  it('keeps valid values and replaces unknown ones with the default', () => {
    const result = sanitizeAvatarOptions({
      skinColor: 'ffdbb4',
      top: 'nao-existe',
      clothing: 'hoodie',
      eyes: 123,
      mouth: 'tongue',
      hairColor: 'zzzzzz',
    });
    expect(result.skinColor).toBe('ffdbb4');
    expect(result.top).toBe(DEFAULT_AVATAR_OPTIONS.top);
    expect(result.clothing).toBe('hoodie');
    expect(result.eyes).toBe(DEFAULT_AVATAR_OPTIONS.eyes);
    expect(result.mouth).toBe('tongue');
    expect(result.hairColor).toBe(DEFAULT_AVATAR_OPTIONS.hairColor);
  });

  it('accepts null for the optional parts (no hair, no accessory, no beard)', () => {
    const result = sanitizeAvatarOptions({ top: null, accessories: null, facialHair: null });
    expect(result.top).toBeNull();
    expect(result.accessories).toBeNull();
    expect(result.facialHair).toBeNull();
  });

  it('normalizes colors (case and "#") and only allows transparent for the background', () => {
    const result = sanitizeAvatarOptions({
      skinColor: '#EDB98A',
      hairColor: 'transparent',
      backgroundColor: 'transparent',
    });
    expect(result.skinColor).toBe('edb98a');
    expect(result.hairColor).toBe(DEFAULT_AVATAR_OPTIONS.hairColor);
    expect(result.backgroundColor).toBe('transparent');
    expect(sanitizeAvatarOptions({ backgroundColor: 'verde' }).backgroundColor).toBe(
      DEFAULT_AVATAR_OPTIONS.backgroundColor,
    );
  });

  it('keeps both hairColor and hatColor, whichever the top uses', () => {
    const withHat = sanitizeAvatarOptions({ top: 'hijab', hairColor: '2c1b18', hatColor: 'ff488e' });
    expect(withHat.top).toBe('hijab');
    expect(withHat.hairColor).toBe('2c1b18');
    expect(withHat.hatColor).toBe('ff488e');
  });
});

describe('sanitizeAvatarConfig / parseStoredAvatarConfig', () => {
  it('reads a valid configuration', () => {
    const config = defaultAvatarConfig();
    expect(sanitizeAvatarConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
  });

  it('returns null for an unknown version or style (back to the initials)', () => {
    expect(sanitizeAvatarConfig({ version: 2, style: 'avataaars', options: {} })).toBeNull();
    expect(sanitizeAvatarConfig({ version: 0, style: 'avataaars', options: {} })).toBeNull();
    expect(sanitizeAvatarConfig({ style: 'avataaars', options: {} })).toBeNull();
    expect(sanitizeAvatarConfig({ version: AVATAR_CONFIG_VERSION, style: 'adventurer', options: {} })).toBeNull();
  });

  it('repairs a configuration with broken options instead of failing', () => {
    const config = sanitizeAvatarConfig({ version: 1, style: 'avataaars', options: { top: 'x', skinColor: 'ffdbb4' } });
    expect(config?.options.skinColor).toBe('ffdbb4');
    expect(config?.options.top).toBe(DEFAULT_AVATAR_OPTIONS.top);
  });

  it('returns null for anything that is not a configuration', () => {
    for (const raw of [null, undefined, 'x', 3, []]) expect(sanitizeAvatarConfig(raw)).toBeNull();
  });

  it('parses stored text safely', () => {
    expect(parseStoredAvatarConfig(null)).toBeNull();
    expect(parseStoredAvatarConfig('')).toBeNull();
    expect(parseStoredAvatarConfig('{nao e json')).toBeNull();
    expect(parseStoredAvatarConfig(JSON.stringify(defaultAvatarConfig()))).toEqual(defaultAvatarConfig());
  });

  it('has a storage key per user', () => {
    expect(avatarStorageKey('u1')).not.toBe(avatarStorageKey('u2'));
    expect(avatarStorageKey('u1')).toContain('u1');
  });
});

describe('randomAvatarConfig', () => {
  function seededRandom(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  it('always produces a valid combination', () => {
    const random = seededRandom(7);
    for (let i = 0; i < 300; i += 1) {
      const config = randomAvatarConfig(random);
      expect(sanitizeAvatarConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
    }
  });

  it('varies between draws and survives the extreme random values', () => {
    const a = randomAvatarConfig(seededRandom(1));
    const b = randomAvatarConfig(seededRandom(2));
    expect(sameAvatarConfig(a, b)).toBe(false);
    for (const value of [0, 0.999999, 1]) {
      const config = randomAvatarConfig(() => value);
      expect(sanitizeAvatarConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
    }
  });
});
