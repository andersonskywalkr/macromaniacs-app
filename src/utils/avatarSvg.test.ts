import { schema } from '@dicebear/avataaars';
import { defaultAvatarConfig, type AvatarConfig, type AvatarOptions } from './avatarConfig';
import {
  activeHeadColorKey,
  avatarSvgCacheSize,
  buildAvatarOptions,
  buildAvatarSvg,
  clearAvatarSvgCache,
} from './avatarSvg';

function config(patch: Partial<AvatarOptions>): AvatarConfig {
  const base = defaultAvatarConfig();
  return { ...base, options: { ...base.options, ...patch } };
}

beforeEach(() => clearAvatarSvgCache());

describe('buildAvatarSvg', () => {
  it('returns an SVG with the requested size', () => {
    const svg = buildAvatarSvg(defaultAvatarConfig(), 96);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="96"');
  });

  it('applies the chosen colors', () => {
    const svg = buildAvatarSvg(
      config({ skinColor: 'ffdbb4', backgroundColor: 'b1e2ff', clothesColor: 'ff488e', hairColor: '2c1b18' }),
      128,
    );
    for (const color of ['ffdbb4', 'b1e2ff', 'ff488e', '2c1b18']) expect(svg).toContain(color);
  });

  it('is deterministic', () => {
    clearAvatarSvgCache();
    const first = buildAvatarSvg(defaultAvatarConfig(), 128);
    clearAvatarSvgCache();
    expect(buildAvatarSvg(defaultAvatarConfig(), 128)).toBe(first);
  });

  it('changes when an option changes', () => {
    const base = buildAvatarSvg(defaultAvatarConfig(), 128);
    expect(buildAvatarSvg(config({ top: 'bob' }), 128)).not.toBe(base);
    expect(buildAvatarSvg(config({ mouth: 'tongue' }), 128)).not.toBe(base);
    expect(buildAvatarSvg(config({ clothing: 'overall' }), 128)).not.toBe(base);
  });

  it('shows the chosen accessory and beard, and nothing when "none"', () => {
    const none = buildAvatarSvg(config({ accessories: null, facialHair: null }), 128);
    const withAccessory = buildAvatarSvg(config({ accessories: 'sunglasses', facialHair: null }), 128);
    const withBeard = buildAvatarSvg(config({ accessories: null, facialHair: 'beardMajestic' }), 128);
    expect(withAccessory).not.toBe(none);
    expect(withBeard).not.toBe(none);

    // "nenhum" é sempre igual, não depende do sorteio
    expect(buildAvatarSvg(config({ accessories: null, facialHair: null, accessoriesColor: 'ff488e' }), 128)).toBe(
      none,
    );
  });

  it('shows no hair when top is null (and then hairColor makes no difference)', () => {
    const noHair = buildAvatarSvg(config({ top: null }), 128);
    expect(noHair).not.toBe(buildAvatarSvg(config({ top: 'shortFlat' }), 128));
    expect(buildAvatarSvg(config({ top: null, hairColor: 'c93305' }), 128)).toBe(noHair);
  });

  it('uses hairColor for hair and hatColor for hats and veils', () => {
    const hairA = buildAvatarSvg(config({ top: 'shortFlat', hairColor: 'a55728', hatColor: '262e33' }), 128);
    expect(buildAvatarSvg(config({ top: 'shortFlat', hairColor: 'c93305', hatColor: '262e33' }), 128)).not.toBe(hairA);
    expect(buildAvatarSvg(config({ top: 'shortFlat', hairColor: 'a55728', hatColor: 'ff488e' }), 128)).toBe(hairA);

    for (const top of ['hat', 'hijab', 'turban', 'winterHat1'] as const) {
      const hatA = buildAvatarSvg(config({ top, hatColor: '5199e4', hairColor: 'a55728' }), 128);
      expect(buildAvatarSvg(config({ top, hatColor: 'ff488e', hairColor: 'a55728' }), 128)).not.toBe(hatA);
      expect(buildAvatarSvg(config({ top, hatColor: '5199e4', hairColor: 'c93305' }), 128)).toBe(hatA);
    }
  });

  it('reports which color is being edited for the chosen top', () => {
    expect(activeHeadColorKey(config({ top: 'bob' }))).toBe('hairColor');
    expect(activeHeadColorKey(config({ top: 'hijab' }))).toBe('hatColor');
    expect(activeHeadColorKey(config({ top: null }))).toBe('hairColor');
  });

  it('renders the graphic only for graphicShirt', () => {
    const shirt = (graphic: AvatarOptions['clothingGraphic']) =>
      buildAvatarSvg(config({ clothing: 'graphicShirt', clothingGraphic: graphic }), 128);
    expect(shirt('skull')).not.toBe(shirt('pizza'));

    const hoodie = (graphic: AvatarOptions['clothingGraphic']) =>
      buildAvatarSvg(config({ clothing: 'hoodie', clothingGraphic: graphic }), 128);
    expect(hoodie('skull')).toBe(hoodie('pizza'));
  });

  it('supports a transparent background', () => {
    expect(() => buildAvatarSvg(config({ backgroundColor: 'transparent' }), 64)).not.toThrow();
  });
});

describe('buildAvatarOptions (probabilities)', () => {
  it('forces 100% for what was chosen and 0% for "none"', () => {
    const chosen = buildAvatarOptions(config({ top: 'bob', accessories: 'round', facialHair: 'beardLight' }), 64);
    expect(chosen).toMatchObject({
      top: ['bob'],
      topProbability: 100,
      accessories: ['round'],
      accessoriesProbability: 100,
      facialHair: ['beardLight'],
      facialHairProbability: 100,
    });

    const none = buildAvatarOptions(config({ top: null, accessories: null, facialHair: null }), 64);
    expect(none).toMatchObject({ topProbability: 0, accessoriesProbability: 0, facialHairProbability: 0 });
    expect(none).not.toHaveProperty('top');
    expect(none).not.toHaveProperty('accessories');
    expect(none).not.toHaveProperty('facialHair');
  });

  it('only uses option names that exist in the style schema', () => {
    const allowed = new Set([
      ...Object.keys((schema as unknown as { properties: Record<string, unknown> }).properties),
      'seed',
      'size',
    ]);
    for (const key of Object.keys(buildAvatarOptions(defaultAvatarConfig(), 64))) expect(allowed.has(key)).toBe(true);
  });

  it('never uses user data as the seed', () => {
    expect(buildAvatarOptions(defaultAvatarConfig(), 64).seed).toBe('macromaniacs');
  });
});

describe('cache', () => {
  it('reuses the result for the same configuration and size', () => {
    expect(avatarSvgCacheSize()).toBe(0);
    const a = buildAvatarSvg(defaultAvatarConfig(), 64);
    expect(avatarSvgCacheSize()).toBe(1);
    const b = buildAvatarSvg(defaultAvatarConfig(), 64);
    expect(b).toBe(a);
    expect(avatarSvgCacheSize()).toBe(1);
  });

  it('keeps separate entries per size and per configuration', () => {
    buildAvatarSvg(defaultAvatarConfig(), 64);
    buildAvatarSvg(defaultAvatarConfig(), 128);
    buildAvatarSvg(config({ top: 'bob' }), 64);
    expect(avatarSvgCacheSize()).toBe(3);
  });

  it('stays bounded', () => {
    for (let i = 0; i < 350; i += 1) {
      buildAvatarSvg(config({ skinColor: i.toString(16).padStart(6, '0') }), 32);
    }
    expect(avatarSvgCacheSize()).toBeLessThanOrEqual(300);
  });
});
