// Avatar de desenho escolhido pelo usuário. O backend persiste somente esta
// configuração; a imagem continua sendo montada pelo app na base DiceBear.

// Versão do endpoint da DiceBear: trocar só aqui (ex.: '9.x').
export const DICEBEAR_VERSION = '10.x';
export const DICEBEAR_BASE_URL = 'https://api.dicebear.com';

// Estilos oferecidos, com a licença de cada um (créditos no README).
export const AVATAR_STYLES = [
  { id: 'avataaars', label: 'Avataaars', creator: 'Pablo Stanley', license: 'Uso pessoal e comercial livre' },
  { id: 'adventurer', label: 'Adventurer', creator: 'Lisa Wischofsky', license: 'CC BY 4.0' },
  { id: 'big-smile', label: 'Big Smile', creator: 'Ashley Seo', license: 'CC BY 4.0' },
  { id: 'fun-emoji', label: 'Fun Emoji', creator: 'Davis Uche', license: 'CC BY 4.0' },
] as const;

export type AvatarStyleId = (typeof AVATAR_STYLES)[number]['id'];

export interface AvatarChoice {
  style: AvatarStyleId;
  seed: string;
}

// A DiceBear limita o PNG a 256 px.
export const AVATAR_MAX_SIZE = 256;

export const AVATAR_OPTIONS_COUNT = 12;

const SEED_LENGTH = 12;
const SEED_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const AVATAR_SEED_PATTERN = /^[A-Za-z0-9]{6,32}$/;

export function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return AVATAR_STYLES.some((style) => style.id === value);
}

export function isAvatarChoice(value: unknown): value is AvatarChoice {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 2 &&
    isAvatarStyleId(record.style) &&
    typeof record.seed === 'string' &&
    AVATAR_SEED_PATTERN.test(record.seed)
  );
}

// Monta a URL do PNG. O seed vai na URL para um serviço de terceiros: por isso
// é sempre uma string aleatória (nunca nome, e-mail ou id do usuário).
export function buildAvatarUrl({
  style,
  seed,
  size,
}: {
  style: AvatarStyleId;
  seed: string;
  size: number;
}): string {
  if (!isAvatarChoice({ style, seed })) {
    throw new Error('Invalid avatar configuration');
  }
  const pixels = Math.min(AVATAR_MAX_SIZE, Math.max(1, Math.round(size)));
  return `${DICEBEAR_BASE_URL}/${DICEBEAR_VERSION}/${style}/png?seed=${encodeURIComponent(seed)}&size=${pixels}`;
}

// Tamanho pedido à API para um avatar exibido com `displaySize` dp: dobra (telas
// densas) e arredonda para cima em degraus de 64 px, para repetir as mesmas URLs
// e aproveitar o cache das imagens.
export function avatarRequestSize(displaySize: number): number {
  const wanted = Math.ceil((displaySize * 2) / 64) * 64;
  return Math.min(AVATAR_MAX_SIZE, Math.max(64, wanted));
}

export function generateAvatarSeed(random: () => number = Math.random): string {
  let seed = '';
  for (let i = 0; i < SEED_LENGTH; i += 1) {
    seed += SEED_CHARS[Math.floor(random() * SEED_CHARS.length)];
  }
  return seed;
}

export function generateAvatarSeeds(count: number = AVATAR_OPTIONS_COUNT): string[] {
  const seeds = new Set<string>();
  while (seeds.size < count) seeds.add(generateAvatarSeed());
  return [...seeds];
}

export function avatarStorageKey(userId: string): string {
  return `macromaniacs:avatar:${userId}`;
}

export function avatarMigrationKey(userId: string): string {
  return `macromaniacs:avatar-migration:v1:${userId}`;
}

// Lê o que está guardado; qualquer coisa fora do formato esperado vira null.
export function parseStoredAvatar(raw: string | null): AvatarChoice | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isAvatarChoice(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
