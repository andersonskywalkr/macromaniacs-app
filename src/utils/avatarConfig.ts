import type { Options } from '@dicebear/avataaars';

// Avatar personalizado (estilo Avataaars, DiceBear), gerado NO APARELHO. Fica só
// neste aparelho: o backend não guarda avatar (ver README).
//
// Versões fixas: @dicebear/core 9.4.3 + @dicebear/avataaars 9.4.2. O core 10
// tem outra API (sem createAvatar e sem o estilo avataaars): não atualizar.

export const AVATAR_CONFIG_VERSION = 1;
export const AVATAR_STYLE = 'avataaars';

type Item<K extends keyof Options> = NonNullable<Options[K]> extends readonly (infer U)[] ? U : never;

export type TopValue = Item<'top'>;
export type ClothingValue = Item<'clothing'>;
export type ClothingGraphicValue = Item<'clothingGraphic'>;
export type AccessoryValue = Item<'accessories'>;
export type EyesValue = Item<'eyes'>;
export type EyebrowsValue = Item<'eyebrows'>;
export type MouthValue = Item<'mouth'>;
export type FacialHairValue = Item<'facialHair'>;

// Valores permitidos (nomes exatos do schema do pacote). O teste
// avatarConfig.test.ts compara tudo com o schema instalado.
export const TOP_VALUES: readonly TopValue[] = [
  'hat',
  'hijab',
  'turban',
  'winterHat1',
  'winterHat02',
  'winterHat03',
  'winterHat04',
  'bob',
  'bun',
  'curly',
  'curvy',
  'dreads',
  'frida',
  'fro',
  'froBand',
  'longButNotTooLong',
  'miaWallace',
  'shavedSides',
  'straight02',
  'straight01',
  'straightAndStrand',
  'dreads01',
  'dreads02',
  'frizzle',
  'shaggy',
  'shaggyMullet',
  'shortCurly',
  'shortFlat',
  'shortRound',
  'shortWaved',
  'sides',
  'theCaesar',
  'theCaesarAndSidePart',
  'bigHair',
];

// Chapéus e véus: usam hatColor (e não hairColor).
export const HAT_TOP_VALUES: readonly TopValue[] = [
  'hat',
  'hijab',
  'turban',
  'winterHat1',
  'winterHat02',
  'winterHat03',
  'winterHat04',
];

export const CLOTHING_VALUES: readonly ClothingValue[] = [
  'blazerAndShirt',
  'blazerAndSweater',
  'collarAndSweater',
  'graphicShirt',
  'hoodie',
  'overall',
  'shirtCrewNeck',
  'shirtScoopNeck',
  'shirtVNeck',
];

export const CLOTHING_GRAPHIC_VALUES: readonly ClothingGraphicValue[] = [
  'bat',
  'bear',
  'cumbia',
  'deer',
  'diamond',
  'hola',
  'pizza',
  'resist',
  'skull',
  'skullOutline',
];

export const ACCESSORY_VALUES: readonly AccessoryValue[] = [
  'kurt',
  'prescription01',
  'prescription02',
  'round',
  'sunglasses',
  'wayfarers',
  'eyepatch',
];

export const EYES_VALUES: readonly EyesValue[] = [
  'closed',
  'cry',
  'default',
  'eyeRoll',
  'happy',
  'hearts',
  'side',
  'squint',
  'surprised',
  'winkWacky',
  'wink',
  'xDizzy',
];

export const EYEBROWS_VALUES: readonly EyebrowsValue[] = [
  'angryNatural',
  'defaultNatural',
  'flatNatural',
  'frownNatural',
  'raisedExcitedNatural',
  'sadConcernedNatural',
  'unibrowNatural',
  'upDownNatural',
  'angry',
  'default',
  'raisedExcited',
  'sadConcerned',
  'upDown',
];

export const MOUTH_VALUES: readonly MouthValue[] = [
  'concerned',
  'default',
  'disbelief',
  'eating',
  'grimace',
  'sad',
  'screamOpen',
  'serious',
  'smile',
  'tongue',
  'twinkle',
  'vomit',
];

export const FACIAL_HAIR_VALUES: readonly FacialHairValue[] = [
  'beardLight',
  'beardMajestic',
  'beardMedium',
  'moustacheFancy',
  'moustacheMagnum',
];

// Paletas padrão do próprio estilo (cores hexadecimais de 6 dígitos, sem "#").
export const SKIN_COLORS: readonly string[] = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4', 'fd9841', 'f8d25c'];
export const HAIR_COLORS: readonly string[] = [
  'a55728',
  '2c1b18',
  'b58143',
  'd6b370',
  '724133',
  '4a312c',
  'f59797',
  'ecdcbf',
  'c93305',
  'e8e1e1',
];
export const FACIAL_HAIR_COLORS: readonly string[] = HAIR_COLORS;
export const HAT_COLORS: readonly string[] = [
  '262e33',
  '65c9ff',
  '5199e4',
  '25557c',
  'e6e6e6',
  '929598',
  '3c4f5c',
  'b1e2ff',
  'a7ffc4',
  'ffdeb5',
  'ffafb9',
  'ffffb1',
  'ff488e',
  'ff5c5c',
  'ffffff',
];
export const ACCESSORIES_COLORS: readonly string[] = HAT_COLORS;
export const CLOTHES_COLORS: readonly string[] = [
  '262e33',
  '65c9ff',
  '5199e4',
  '25557c',
  'e6e6e6',
  '929598',
  '3c4f5c',
  'b1e2ff',
  'a7ffc4',
  'ffafb9',
  'ffffb1',
  'ff488e',
  'ff5c5c',
  'ffffff',
];

// Fundo: a opção aceita qualquer hexadecimal; a tela oferece tons do roxo do
// app, alguns neutros e "transparent".
export const TRANSPARENT = 'transparent';
export const BACKGROUND_COLORS: readonly string[] = [
  'ede4ff',
  'c4adf9',
  '8b5cf6',
  '6d28d9',
  '5b21b6',
  'ffffff',
  'e6e6e6',
  '929598',
  '3c4f5c',
  '262e33',
  TRANSPARENT,
];

export interface AvatarOptions {
  skinColor: string;
  // null = sem cabelo (topProbability 0)
  top: TopValue | null;
  hairColor: string;
  hatColor: string;
  clothing: ClothingValue;
  clothesColor: string;
  clothingGraphic: ClothingGraphicValue;
  // null = nenhum (accessoriesProbability 0)
  accessories: AccessoryValue | null;
  accessoriesColor: string;
  eyes: EyesValue;
  eyebrows: EyebrowsValue;
  mouth: MouthValue;
  // null = sem barba (facialHairProbability 0)
  facialHair: FacialHairValue | null;
  facialHairColor: string;
  backgroundColor: string;
}

export interface AvatarConfig {
  version: typeof AVATAR_CONFIG_VERSION;
  style: typeof AVATAR_STYLE;
  options: AvatarOptions;
}

// Combinação padrão fixa e agradável: a tela de personalização abre com ela.
export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  skinColor: 'edb98a',
  top: 'shortFlat',
  hairColor: '4a312c',
  hatColor: '262e33',
  clothing: 'hoodie',
  clothesColor: '5199e4',
  clothingGraphic: 'bear',
  accessories: null,
  accessoriesColor: '262e33',
  eyes: 'happy',
  eyebrows: 'defaultNatural',
  mouth: 'smile',
  facialHair: null,
  facialHairColor: '2c1b18',
  backgroundColor: 'ede4ff',
};

export function defaultAvatarConfig(): AvatarConfig {
  return {
    version: AVATAR_CONFIG_VERSION,
    style: AVATAR_STYLE,
    options: { ...DEFAULT_AVATAR_OPTIONS },
  };
}

export function isHatTop(top: TopValue | null): boolean {
  return top !== null && HAT_TOP_VALUES.includes(top);
}

const HEX_COLOR = /^[a-fA-F0-9]{6}$/;

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

// Opção que pode ser "nenhum": null é válido; valor desconhecido volta ao padrão.
function pickNullableEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T | null): T | null {
  if (value === null) return null;
  return pickEnum(value, allowed, fallback as T) as T | null;
}

function pickColor(value: unknown, fallback: string, allowTransparent = false): string {
  if (typeof value !== 'string') return fallback;
  const color = value.trim().replace(/^#/, '');
  if (HEX_COLOR.test(color)) return color.toLowerCase();
  if (allowTransparent && color === TRANSPARENT) return TRANSPARENT;
  return fallback;
}

// Valida e corrige as opções: cada valor desconhecido volta ao padrão, sem
// quebrar o app.
export function sanitizeAvatarOptions(raw: unknown): AvatarOptions {
  const source = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_AVATAR_OPTIONS;

  return {
    skinColor: pickColor(source.skinColor, d.skinColor),
    top: pickNullableEnum(source.top, TOP_VALUES, d.top),
    hairColor: pickColor(source.hairColor, d.hairColor),
    hatColor: pickColor(source.hatColor, d.hatColor),
    clothing: pickEnum(source.clothing, CLOTHING_VALUES, d.clothing),
    clothesColor: pickColor(source.clothesColor, d.clothesColor),
    clothingGraphic: pickEnum(source.clothingGraphic, CLOTHING_GRAPHIC_VALUES, d.clothingGraphic),
    accessories: pickNullableEnum(source.accessories, ACCESSORY_VALUES, d.accessories),
    accessoriesColor: pickColor(source.accessoriesColor, d.accessoriesColor),
    eyes: pickEnum(source.eyes, EYES_VALUES, d.eyes),
    eyebrows: pickEnum(source.eyebrows, EYEBROWS_VALUES, d.eyebrows),
    mouth: pickEnum(source.mouth, MOUTH_VALUES, d.mouth),
    facialHair: pickNullableEnum(source.facialHair, FACIAL_HAIR_VALUES, d.facialHair),
    facialHairColor: pickColor(source.facialHairColor, d.facialHairColor),
    backgroundColor: pickColor(source.backgroundColor, d.backgroundColor, true),
  };
}

// Lê uma configuração guardada. Versão ou estilo desconhecidos (por exemplo,
// gravados por uma versão futura do app) viram null: o app volta às iniciais.
export function sanitizeAvatarConfig(raw: unknown): AvatarConfig | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { version, style, options } = raw as Record<string, unknown>;
  if (version !== AVATAR_CONFIG_VERSION || style !== AVATAR_STYLE) return null;
  return {
    version: AVATAR_CONFIG_VERSION,
    style: AVATAR_STYLE,
    options: sanitizeAvatarOptions(options),
  };
}

export function parseStoredAvatarConfig(raw: string | null): AvatarConfig | null {
  if (!raw) return null;
  try {
    return sanitizeAvatarConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function avatarStorageKey(userId: string): string {
  return `macromaniacs:avatar-config:${userId}`;
}

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

// Combinação aleatória, sempre válida.
export function randomAvatarConfig(random: () => number = Math.random): AvatarConfig {
  return {
    version: AVATAR_CONFIG_VERSION,
    style: AVATAR_STYLE,
    options: {
      skinColor: pick(SKIN_COLORS, random),
      top: random() < 0.05 ? null : pick(TOP_VALUES, random),
      hairColor: pick(HAIR_COLORS, random),
      hatColor: pick(HAT_COLORS, random),
      clothing: pick(CLOTHING_VALUES, random),
      clothesColor: pick(CLOTHES_COLORS, random),
      clothingGraphic: pick(CLOTHING_GRAPHIC_VALUES, random),
      accessories: random() < 0.7 ? null : pick(ACCESSORY_VALUES, random),
      accessoriesColor: pick(ACCESSORIES_COLORS, random),
      eyes: pick(EYES_VALUES, random),
      eyebrows: pick(EYEBROWS_VALUES, random),
      mouth: pick(MOUTH_VALUES, random),
      facialHair: random() < 0.7 ? null : pick(FACIAL_HAIR_VALUES, random),
      facialHairColor: pick(FACIAL_HAIR_COLORS, random),
      backgroundColor: pick(BACKGROUND_COLORS, random),
    },
  };
}

export function sameAvatarConfig(a: AvatarConfig, b: AvatarConfig): boolean {
  return JSON.stringify(a.options) === JSON.stringify(b.options);
}
