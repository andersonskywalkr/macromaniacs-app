import {
  COMPOSITE_WORDS,
  FLAVOR_WORDS,
  SCORE,
  normalizeForSearch,
  rankFoodsByRelevance,
  scoreFoodName,
} from './foodRelevance';

const foods = (...names: string[]) => names.map((name) => ({ name }));
const names = (list: { name: string }[]) => list.map((food) => food.name);

describe('normalizeForSearch', () => {
  it('lowercases, removes accents and punctuation, and collapses spaces', () => {
    expect(normalizeForSearch('  Feijão,   FRADINHO (Marca) ')).toBe('feijao fradinho marca');
    expect(normalizeForSearch('Pão-de-Queijo!')).toBe('pao de queijo');
    expect(normalizeForSearch('')).toBe('');
  });
});

describe('rankFoodsByRelevance: "Frango Grelhado"', () => {
  const list = foods(
    'Salgadinho sabor frango grelhado',
    'Arroz com frango grelhado',
    'Frango grelhado, arroz integral e creme de milho',
    'Frango grelhado',
  );

  it('puts the plain food before the composite dish and the flavored snack', () => {
    const ranked = names(rankFoodsByRelevance(list, 'Frango Grelhado'));
    expect(ranked[0]).toBe('Frango grelhado');
    expect(ranked.indexOf('Frango grelhado')).toBeLessThan(ranked.indexOf('Arroz com frango grelhado'));
    expect(ranked.indexOf('Frango grelhado')).toBeLessThan(ranked.indexOf('Salgadinho sabor frango grelhado'));
  });

  it('puts the composite dish before the flavored snack', () => {
    const ranked = names(rankFoodsByRelevance(list, 'Frango Grelhado'));
    expect(ranked.indexOf('Arroz com frango grelhado')).toBeLessThan(ranked.indexOf('Salgadinho sabor frango grelhado'));
  });

  it('ranks names that start with the query above names that only contain it', () => {
    const ranked = names(rankFoodsByRelevance(list, 'frango grelhado'));
    expect(ranked.indexOf('Frango grelhado, arroz integral e creme de milho')).toBeLessThan(
      ranked.indexOf('Arroz com frango grelhado'),
    );
  });

  it('treats a brand in parentheses as part of the same food', () => {
    const ranked = names(
      rankFoodsByRelevance(foods('Frango grelhado com legumes', 'Frango Grelhado (Marca X)'), 'frango grelhado'),
    );
    expect(ranked[0]).toBe('Frango Grelhado (Marca X)');
    expect(scoreFoodName('Frango Grelhado (Marca X)', 'frango grelhado')).toBe(SCORE.exact);
  });
});

describe('accents, case and punctuation', () => {
  it('matches without caring about accents or case', () => {
    const ranked = names(rankFoodsByRelevance(foods('Arroz com feijão', 'Feijão'), 'FEIJAO'));
    expect(ranked[0]).toBe('Feijão');
    expect(scoreFoodName('Feijão', 'feijao')).toBe(SCORE.exact);
    expect(scoreFoodName('FEIJÃO', 'Feijão')).toBe(SCORE.exact);
  });

  it('ignores punctuation in the name and in the query', () => {
    expect(scoreFoodName('Frango, grelhado!', 'frango grelhado')).toBe(SCORE.exact);
    expect(scoreFoodName('Frango grelhado', '  frango-grelhado ')).toBe(SCORE.exact);
  });
});

describe('one-word queries', () => {
  it('"arroz": the plain rice first, then names starting with it, then the rest', () => {
    const ranked = names(
      rankFoodsByRelevance(
        foods('Feijão com arroz', 'Arroz com frango', 'Arroz integral', 'Arroz', 'Bolinho de arroz'),
        'arroz',
      ),
    );
    expect(ranked[0]).toBe('Arroz');
    expect(ranked[1]).toBe('Arroz integral');
    expect(ranked[2]).toBe('Arroz com frango'); // começa com "arroz", mas é prato composto
    expect(ranked.slice(3).sort()).toEqual(['Bolinho de arroz', 'Feijão com arroz']);
  });

  it('"banana": exact, then starts with, then contains', () => {
    const ranked = names(
      rankFoodsByRelevance(foods('Bolo de banana', 'Banana prata', 'Banana', 'Iogurte sabor banana'), 'banana'),
    );
    expect(ranked).toEqual(['Banana', 'Banana prata', 'Bolo de banana', 'Iogurte sabor banana']);
  });

  it('a word prefix ranks below a whole-word start', () => {
    expect(scoreFoodName('Arroz integral', 'arroz')).toBeGreaterThan(scoreFoodName('Arrozal', 'arroz'));
  });

  it('a substring inside a word still ranks above no match', () => {
    expect(scoreFoodName('Ricota fresca', 'cota')).toBeGreaterThan(scoreFoodName('Banana', 'cota'));
  });
});

describe('penalties', () => {
  it('only penalize when the query is a simple food without those words', () => {
    expect(scoreFoodName('Salgadinho sabor frango grelhado', 'frango grelhado')).toBeLessThan(
      scoreFoodName('Filé de frango grelhado', 'frango grelhado'),
    );
    // a pessoa pediu "sabor": sem penalidade (sobra só o bônus de posição)
    const withFlavorQuery = scoreFoodName('Salgadinho sabor queijo', 'sabor queijo');
    const withoutFlavorQuery = scoreFoodName('Salgadinho sabor queijo', 'queijo');
    expect(withFlavorQuery).toBe(SCORE.allWords + 40);
    expect(withoutFlavorQuery).toBeLessThan(SCORE.allWords + 30);
  });

  it('does not penalize long queries (not a simple food)', () => {
    const long = 'arroz com frango grelhado e legumes';
    expect(scoreFoodName('Arroz com frango grelhado e legumes', long)).toBe(SCORE.exact);
    expect(scoreFoodName('Arroz com frango grelhado e legumes cozidos', long)).toBe(SCORE.startsWithWord);
  });

  it('keeps the word lists in one place and small', () => {
    expect(FLAVOR_WORDS).toEqual(expect.arrayContaining(['sabor', 'tempero', 'molho', 'snack']));
    expect(COMPOSITE_WORDS).toEqual(['com', 'e']);
  });
});

describe('tie-breaking and edge cases', () => {
  it('breaks ties by shorter name, then alphabetical order', () => {
    const ranked = names(
      rankFoodsByRelevance(foods('Banana nanica grande', 'Banana prata', 'Banana maçã', 'Banana ouro'), 'banana'),
    );
    expect(ranked).toEqual(['Banana maçã', 'Banana ouro', 'Banana prata', 'Banana nanica grande']);
  });

  it('keeps the original order for items with the same name', () => {
    const items = [
      { name: 'Arroz', id: 'a' },
      { name: 'Arroz', id: 'b' },
      { name: 'Arroz', id: 'c' },
    ];
    expect(rankFoodsByRelevance(items, 'arroz').map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list for an empty list, and does not change the input', () => {
    expect(rankFoodsByRelevance([], 'arroz')).toEqual([]);
    const input = foods('B', 'A');
    const copy = [...input];
    rankFoodsByRelevance(input, 'a');
    expect(input).toEqual(copy);
  });

  it('with an empty query every item scores the same and the order is kept stable by name', () => {
    expect(scoreFoodName('Arroz', '   ')).toBe(0);
    expect(names(rankFoodsByRelevance(foods('Bb', 'Aa', 'Cc'), ''))).toEqual(['Aa', 'Bb', 'Cc']);
  });

  it('keeps the other fields of the items', () => {
    const items = [{ name: 'Arroz integral', id: 'x', extra: 1 }];
    expect(rankFoodsByRelevance(items, 'arroz')[0]).toBe(items[0]);
  });
});
