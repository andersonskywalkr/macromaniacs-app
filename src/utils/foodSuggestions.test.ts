import {
  isSuggestionQuery,
  normalizeText,
  splitHighlight,
} from './foodSuggestions';

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
