import {
  AVATAR_STYLES,
  DICEBEAR_VERSION,
  avatarRequestSize,
  avatarStorageKey,
  buildAvatarUrl,
  generateAvatarSeed,
  generateAvatarSeeds,
  parseStoredAvatar,
} from './avatar';

describe('buildAvatarUrl', () => {
  it('builds the PNG url with style, seed and size', () => {
    expect(buildAvatarUrl({ style: 'adventurer', seed: 'abc123xyz789', size: 128 })).toBe(
      `https://api.dicebear.com/${DICEBEAR_VERSION}/adventurer/png?seed=abc123xyz789&size=128`,
    );
  });

  it('uses the 10.x endpoint', () => {
    expect(buildAvatarUrl({ style: 'avataaars', seed: 'abcdef123456', size: 64 })).toContain('/10.x/avataaars/png');
  });

  it('rejects a seed that could inject arbitrary URL content', () => {
    expect(() =>
      buildAvatarUrl({ style: 'big-smile', seed: 'a b&c=d/é', size: 64 }),
    ).toThrow('Invalid avatar configuration');
  });

  it('limits the size to what the API accepts (256 px)', () => {
    expect(buildAvatarUrl({ style: 'fun-emoji', seed: 'abcdef123456', size: 1000 })).toContain('size=256');
    expect(buildAvatarUrl({ style: 'fun-emoji', seed: 'abcdef123456', size: 0 })).toContain('size=1');
  });
});

describe('avatarRequestSize', () => {
  it('doubles the displayed size in steps of 64, up to 256', () => {
    expect(avatarRequestSize(28)).toBe(64);
    expect(avatarRequestSize(44)).toBe(128);
    expect(avatarRequestSize(64)).toBe(128);
    expect(avatarRequestSize(100)).toBe(256);
    expect(avatarRequestSize(400)).toBe(256);
  });
});

describe('seeds', () => {
  it('generates random alphanumeric seeds of 12 characters', () => {
    const seed = generateAvatarSeed();
    expect(seed).toMatch(/^[a-z0-9]{12}$/);
  });

  it('generates 12 different seeds', () => {
    const seeds = generateAvatarSeeds();
    expect(seeds).toHaveLength(12);
    expect(new Set(seeds).size).toBe(12);
  });

  it('does not depend on any user data (only on the random source)', () => {
    const values = [0, 0.5, 0.99];
    let i = 0;
    const seed = generateAvatarSeed(() => values[i++ % values.length]);
    expect(seed).toMatch(/^[a-z0-9]{12}$/);
  });
});

describe('stored avatar', () => {
  it('has a key per user', () => {
    expect(avatarStorageKey('u1')).not.toBe(avatarStorageKey('u2'));
    expect(avatarStorageKey('u1')).toContain('u1');
  });

  it('reads a valid value', () => {
    expect(parseStoredAvatar(JSON.stringify({ style: 'fun-emoji', seed: 'abc123def456' }))).toEqual({
      style: 'fun-emoji',
      seed: 'abc123def456',
    });
  });

  it.each([
    null,
    '',
    'not json',
    '42',
    JSON.stringify({ style: 'nao-existe', seed: 'abc123def456' }),
    JSON.stringify({ style: 'avataaars', seed: 'curto' }),
    JSON.stringify({ style: 'avataaars', seed: 'tem espaço e /' }),
    JSON.stringify({ style: 'avataaars' }),
    JSON.stringify({ style: 'avataaars', seed: 'abc123def456', url: 'https://evil.example' }),
  ])('ignores invalid data (%p)', (raw) => {
    expect(parseStoredAvatar(raw)).toBeNull();
  });

  it('offers the four planned styles', () => {
    expect(AVATAR_STYLES.map((style) => style.id)).toEqual(['avataaars', 'adventurer', 'big-smile', 'fun-emoji']);
  });
});
