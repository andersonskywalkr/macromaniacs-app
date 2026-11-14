import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import { isHatTop, type AvatarConfig } from './avatarConfig';

// Gera o SVG do avatar no aparelho (sem rede). Determinístico: a mesma
// configuração e o mesmo tamanho sempre dão o mesmo SVG.

// Seed fixa: nenhuma opção fica por conta do sorteio (tudo vem da configuração).
const SEED = 'macromaniacs';

const CACHE_LIMIT = 300;
const cache = new Map<string, string>();

function cacheKey(config: AvatarConfig, size: number): string {
  return `${size}|${JSON.stringify(config.options)}`;
}

// Opções do createAvatar a partir da configuração. As probabilidades deixam o
// resultado determinístico: o que foi escolhido aparece (100) e "nenhum" não (0).
export function buildAvatarOptions(config: AvatarConfig, size: number) {
  const o = config.options;
  return {
    seed: SEED,
    size,
    style: ['default' as const],
    skinColor: [o.skinColor],
    ...(o.top === null
      ? { topProbability: 0 }
      : { top: [o.top], topProbability: 100 }),
    // chapéus e véus usam hatColor; os demais, hairColor
    hairColor: [o.hairColor],
    hatColor: [o.hatColor],
    clothing: [o.clothing],
    clothesColor: [o.clothesColor],
    clothingGraphic: [o.clothingGraphic],
    ...(o.accessories === null
      ? { accessoriesProbability: 0 }
      : { accessories: [o.accessories], accessoriesProbability: 100 }),
    accessoriesColor: [o.accessoriesColor],
    eyes: [o.eyes],
    eyebrows: [o.eyebrows],
    mouth: [o.mouth],
    ...(o.facialHair === null
      ? { facialHairProbability: 0 }
      : { facialHair: [o.facialHair], facialHairProbability: 100 }),
    facialHairColor: [o.facialHairColor],
    backgroundColor: [o.backgroundColor],
  };
}

// Qual cor vale para o cabelo/chapéu escolhido (para a legenda da tela).
export function activeHeadColorKey(config: AvatarConfig): 'hairColor' | 'hatColor' {
  return isHatTop(config.options.top) ? 'hatColor' : 'hairColor';
}

export function buildAvatarSvg(config: AvatarConfig, size: number): string {
  const key = cacheKey(config, size);
  const cached = cache.get(key);
  if (cached !== undefined) {
    // reinsere para manter os mais usados por último
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const svg = createAvatar(avataaars, buildAvatarOptions(config, size)).toString();

  cache.set(key, svg);
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return svg;
}

export function clearAvatarSvgCache(): void {
  cache.clear();
}

export function avatarSvgCacheSize(): number {
  return cache.size;
}
