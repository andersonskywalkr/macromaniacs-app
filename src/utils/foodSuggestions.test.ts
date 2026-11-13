import type { FoodItem } from '@/api/types/domain';
import {
  isSuggestionQuery,
  normalizeText,
  rankSuggestions,
  splitHighlight,
  suggestionGroup,
} from './foodSuggestions';

const food = (id: string, name: string, brand: string | null = null): FoodItem => ({
  id,
  name,
  brand,
  source: 'TBCA',
  externalId: null,
  barcode: null,
  nutritionPer100g: { calories: 100, protein: 1, carbohydrates: 1, fat: 1, fiber: 0 },
});

describe('normalizeText', () => {
  it('ignores case and accents, keeping the length', () => {
    expect(normalizeText('Feijão Carioca')).toBe('feijao carioca');
    expect(normalizeText('ÇÃO')).toBe('cao');
    expect(normalizeText('Pão de Açúcar')).toHaveLength('Pão de Açúcar'.length);
  });
});

describe('isSuggestionQuery', () => {
  it('needs 2 to 100 characters (after trimming)', () => {
    expect(isSuggestionQuery('f')).toBe(false);
    expect(isSuggestionQuery(' f ')).toBe(false);
    expect(isSuggestionQuery('fr')).toBe(true);
    expect(isSuggestionQuery('a'.repeat(100))).toBe(true);
    expect(isSuggestionQuery('a'.repeat(101))).toBe(false);
  });
});

describe('suggestion order', () => {
  it('puts names that start with the text first, then names with a word that starts with it, then the rest', () => {
    expect(suggestionGroup('Frango frito', 'fr')).toBe(0);
    expect(suggestionGroup('Peito de frango', 'fr')).toBe(1);
    expect(suggestionGroup('Pão francês', 'fran')).toBe(1);
    expect(suggestionGroup('Refrigerante', 'fr')).toBe(2);
    expect(suggestionGroup('FRANGO', 'frango')).toBe(0);
    expect(suggestionGroup('Feijão', 'FEIJAO')).toBe(0);
  });

  it('keeps the original order inside each group', () => {
    const ranked = rankSuggestions(
      [
        food('1', 'Refrigerante'),
        food('2', 'Peito de frango grelhado'),
        food('3', 'Frango frito'),
        food('4', 'Salada de frutas'),
        food('5', 'Frango grelhado'),
        food('6', 'Fruta cristalizada'),
      ],
      'fr',
    );

    expect(ranked.map((f) => f.id)).toEqual(['3', '5', '6', '2', '4', '1']);
  });

  it('returns at most 8', () => {
    const many = Array.from({ length: 12 }, (_, i) => food(String(i), `Frango ${i}`));
    expect(rankSuggestions(many, 'fr')).toHaveLength(8);
    expect(rankSuggestions(many, 'fr', 3)).toHaveLength(3);
  });
});

describe('splitHighlight', () => {
  it('marks the typed part, ignoring case and accents', () => {
    expect(splitHighlight('Frango frito', 'frango fr')).toEqual([
      { text: 'Frango fr', match: true },
      { text: 'ito', match: false },
    ]);
    expect(splitHighlight('Feijão carioca', 'feijao')).toEqual([
      { text: 'Feijão', match: true },
      { text: ' carioca', match: false },
    ]);
  });

  it('highlights a match in the middle of the name', () => {
    expect(splitHighlight('Peito de frango', 'fran')).toEqual([
      { text: 'Peito de ', match: false },
      { text: 'fran', match: true },
      { text: 'go', match: false },
    ]);
  });

  it('returns the whole name when there is no match or no text', () => {
    expect(splitHighlight('Arroz', 'xyz')).toEqual([{ text: 'Arroz', match: false }]);
    expect(splitHighlight('Arroz', '  ')).toEqual([{ text: 'Arroz', match: false }]);
  });
});
