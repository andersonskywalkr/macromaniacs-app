import {
  ACCESSORIES_COLORS,
  ACCESSORY_VALUES,
  BACKGROUND_COLORS,
  CLOTHES_COLORS,
  CLOTHING_GRAPHIC_VALUES,
  CLOTHING_VALUES,
  EYEBROWS_VALUES,
  EYES_VALUES,
  FACIAL_HAIR_COLORS,
  FACIAL_HAIR_VALUES,
  HAIR_COLORS,
  HAT_COLORS,
  MOUTH_VALUES,
  SKIN_COLORS,
  TOP_VALUES,
  isHatTop,
  type AvatarOptions,
} from '@/utils/avatarConfig';

// Categorias da tela "Personalizar avatar" e o que cada uma mostra. Só dados:
// a tela (AvatarCustomizerScreen) desenha as linhas.

export type CategoryId =
  | 'skin'
  | 'hair'
  | 'hairColor'
  | 'clothes'
  | 'accessories'
  | 'expression'
  | 'beard'
  | 'background';

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'skin', label: 'Pele' },
  { id: 'hair', label: 'Cabelo' },
  { id: 'hairColor', label: 'Cor do cabelo' },
  { id: 'clothes', label: 'Roupa' },
  { id: 'accessories', label: 'Acessórios' },
  { id: 'expression', label: 'Expressão' },
  { id: 'beard', label: 'Barba' },
  { id: 'background', label: 'Fundo' },
];

// Opções com miniatura (valor null = "nenhum", quando existe).
export type OptionField =
  | 'top'
  | 'clothing'
  | 'clothingGraphic'
  | 'accessories'
  | 'eyes'
  | 'eyebrows'
  | 'mouth'
  | 'facialHair';

// Opções de cor (bolinhas).
export type ColorField =
  | 'skinColor'
  | 'hairColor'
  | 'hatColor'
  | 'clothesColor'
  | 'accessoriesColor'
  | 'facialHairColor'
  | 'backgroundColor';

export interface OptionItem {
  value: string | null;
  // posição (1 a total) para o rótulo de acessibilidade
  position: number;
}

export type PanelRow =
  | { type: 'title'; key: string; text: string }
  | { type: 'note'; key: string; text: string }
  | { type: 'colors'; key: string; field: ColorField; label: string; colors: readonly string[] }
  | { type: 'options'; key: string; field: OptionField; label: string; total: number; items: OptionItem[] };

export const OPTIONS_PER_ROW = 4;

const OPTION_VALUES: Record<OptionField, readonly string[]> = {
  top: TOP_VALUES,
  clothing: CLOTHING_VALUES,
  clothingGraphic: CLOTHING_GRAPHIC_VALUES,
  accessories: ACCESSORY_VALUES,
  eyes: EYES_VALUES,
  eyebrows: EYEBROWS_VALUES,
  mouth: MOUTH_VALUES,
  facialHair: FACIAL_HAIR_VALUES,
};

// Campos que aceitam "nenhum" (null): aparece como primeira opção.
const NULLABLE: Partial<Record<OptionField, true>> = { top: true, accessories: true, facialHair: true };

export function optionValues(field: OptionField): (string | null)[] {
  return NULLABLE[field] ? [null, ...OPTION_VALUES[field]] : [...OPTION_VALUES[field]];
}

function optionRows(field: OptionField, label: string): PanelRow[] {
  const values = optionValues(field);
  const rows: PanelRow[] = [];
  for (let start = 0; start < values.length; start += OPTIONS_PER_ROW) {
    rows.push({
      type: 'options',
      key: `${field}-${start}`,
      field,
      label,
      total: values.length,
      items: values
        .slice(start, start + OPTIONS_PER_ROW)
        .map((value, offset) => ({ value, position: start + offset + 1 })),
    });
  }
  return rows;
}

function colorRow(field: ColorField, label: string, colors: readonly string[]): PanelRow {
  return { type: 'colors', key: `${field}-colors`, field, label, colors };
}

// Qual cor vale para o cabelo/chapéu escolhido.
export function headColorField(top: AvatarOptions['top']): 'hairColor' | 'hatColor' {
  return isHatTop(top) ? 'hatColor' : 'hairColor';
}

export function buildPanelRows(category: CategoryId, options: AvatarOptions): PanelRow[] {
  switch (category) {
    case 'skin':
      return [colorRow('skinColor', 'Pele', SKIN_COLORS)];

    case 'hair':
      return optionRows('top', 'Cabelo');

    case 'hairColor': {
      if (options.top === null) {
        return [
          { type: 'note', key: 'hairColor-note', text: 'Sem cabelo escolhido: a cor não aparece. Escolha um estilo em Cabelo.' },
          colorRow('hairColor', 'Cor do cabelo', HAIR_COLORS),
        ];
      }
      const hat = isHatTop(options.top);
      return [
        {
          type: 'note',
          key: 'hairColor-note',
          text: hat ? 'Editando a cor do chapéu (ou véu).' : 'Editando a cor do cabelo.',
        },
        hat
          ? colorRow('hatColor', 'Cor do chapéu', HAT_COLORS)
          : colorRow('hairColor', 'Cor do cabelo', HAIR_COLORS),
      ];
    }

    case 'clothes': {
      const rows: PanelRow[] = [
        ...optionRows('clothing', 'Roupa'),
        { type: 'title', key: 'clothes-color-title', text: 'COR DA ROUPA' },
        colorRow('clothesColor', 'Cor da roupa', CLOTHES_COLORS),
      ];
      if (options.clothing === 'graphicShirt') {
        rows.push(
          { type: 'title', key: 'graphic-title', text: 'ESTAMPA' },
          ...optionRows('clothingGraphic', 'Estampa'),
        );
      }
      return rows;
    }

    case 'accessories':
      return [
        ...optionRows('accessories', 'Acessórios'),
        { type: 'title', key: 'accessories-color-title', text: 'COR DO ACESSÓRIO' },
        colorRow('accessoriesColor', 'Cor do acessório', ACCESSORIES_COLORS),
      ];

    case 'expression':
      return [
        { type: 'title', key: 'eyes-title', text: 'OLHOS' },
        ...optionRows('eyes', 'Olhos'),
        { type: 'title', key: 'eyebrows-title', text: 'SOBRANCELHAS' },
        ...optionRows('eyebrows', 'Sobrancelhas'),
        { type: 'title', key: 'mouth-title', text: 'BOCA' },
        ...optionRows('mouth', 'Boca'),
      ];

    case 'beard':
      return [
        ...optionRows('facialHair', 'Barba'),
        { type: 'title', key: 'beard-color-title', text: 'COR DA BARBA' },
        colorRow('facialHairColor', 'Cor da barba', FACIAL_HAIR_COLORS),
      ];

    case 'background':
      return [colorRow('backgroundColor', 'Fundo', BACKGROUND_COLORS)];
  }
}
