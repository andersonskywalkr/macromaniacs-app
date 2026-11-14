import { defaultAvatarConfig, type AvatarOptions } from '@/utils/avatarConfig';
import {
  CATEGORIES,
  OPTIONS_PER_ROW,
  buildPanelRows,
  headColorField,
  optionValues,
  type CategoryId,
} from './avatarCategories';

const options = (patch: Partial<AvatarOptions> = {}): AvatarOptions => ({ ...defaultAvatarConfig().options, ...patch });
const ids = (category: CategoryId, patch: Partial<AvatarOptions> = {}) =>
  buildPanelRows(category, options(patch)).map((row) => row.key);

describe('avatar categories', () => {
  it('has the eight categories of the spec, in order', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual([
      'Pele',
      'Cabelo',
      'Cor do cabelo',
      'Roupa',
      'Acessórios',
      'Expressão',
      'Barba',
      'Fundo',
    ]);
  });

  it('lists the right number of options (with "none" where it exists)', () => {
    expect(optionValues('top')).toHaveLength(35); // 34 + sem cabelo
    expect(optionValues('top')[0]).toBeNull();
    expect(optionValues('clothing')).toHaveLength(9);
    expect(optionValues('clothingGraphic')).toHaveLength(10);
    expect(optionValues('accessories')).toHaveLength(8); // 7 + nenhum
    expect(optionValues('facialHair')).toHaveLength(6); // 5 + sem barba
    expect(optionValues('eyes')).toHaveLength(12);
    expect(optionValues('eyebrows')).toHaveLength(13);
    expect(optionValues('mouth')).toHaveLength(12);
  });

  it('chunks the options in rows with the right positions', () => {
    const rows = buildPanelRows('hair', options());
    expect(rows).toHaveLength(Math.ceil(35 / OPTIONS_PER_ROW));
    const items = rows.flatMap((row) => (row.type === 'options' ? row.items : []));
    expect(items.map((item) => item.position)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
  });

  it('Pele and Fundo are only color bubbles (no avatar thumbnails)', () => {
    expect(buildPanelRows('skin', options()).map((row) => row.type)).toEqual(['colors']);
    expect(buildPanelRows('background', options()).map((row) => row.type)).toEqual(['colors']);
  });

  it('Cor do cabelo edits hairColor for hair, hatColor for hats and veils', () => {
    expect(headColorField('shortFlat')).toBe('hairColor');
    expect(headColorField(null)).toBe('hairColor');
    for (const top of ['hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04'] as const) {
      expect(headColorField(top)).toBe('hatColor');
    }

    const hairRows = buildPanelRows('hairColor', options({ top: 'bob' }));
    expect(hairRows.find((row) => row.type === 'colors')).toMatchObject({ field: 'hairColor' });
    expect(hairRows.find((row) => row.type === 'note')).toMatchObject({ text: 'Editando a cor do cabelo.' });

    const hatRows = buildPanelRows('hairColor', options({ top: 'turban' }));
    expect(hatRows.find((row) => row.type === 'colors')).toMatchObject({ field: 'hatColor' });
    expect(hatRows.find((row) => row.type === 'note')).toMatchObject({ text: 'Editando a cor do chapéu (ou véu).' });
  });

  it('shows the print selector only for graphicShirt', () => {
    expect(ids('clothes', { clothing: 'hoodie' })).not.toContain('graphic-title');
    expect(ids('clothes', { clothing: 'graphicShirt' })).toContain('graphic-title');
    expect(ids('clothes', { clothing: 'graphicShirt' })).toContain('clothingGraphic-0');
  });

  it('Acessórios and Barba come with their color', () => {
    expect(buildPanelRows('accessories', options()).some((row) => row.type === 'colors')).toBe(true);
    expect(buildPanelRows('beard', options()).some((row) => row.type === 'colors')).toBe(true);
  });

  it('Expressão has eyes, eyebrows and mouth sections', () => {
    const keys = ids('expression');
    expect(keys).toEqual(expect.arrayContaining(['eyes-title', 'eyebrows-title', 'mouth-title']));
  });

  it('has unique keys within each category', () => {
    for (const { id } of CATEGORIES) {
      const keys = ids(id, { clothing: 'graphicShirt' });
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
