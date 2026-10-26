import { decodeMealName, encodeMealName } from './mealName';

describe('encodeMealName', () => {
  it('sends only the type label when there is no name', () => {
    expect(encodeMealName('LUNCH')).toBe('Almoço');
    expect(encodeMealName('LUNCH', '')).toBe('Almoço');
    expect(encodeMealName('SNACK', '   ')).toBe('Lanche');
  });

  it('sends "Tipo - Nome" when the plate has a name', () => {
    expect(encodeMealName('LUNCH', 'Almoço de segunda')).toBe('Almoço - Almoço de segunda');
    expect(encodeMealName('BREAKFAST', ' Pão e café ')).toBe('Café da manhã - Pão e café');
  });
});

describe('decodeMealName', () => {
  it('reads the type and the name back', () => {
    expect(decodeMealName('Jantar - Sopa de legumes')).toEqual({
      mealType: 'DINNER',
      name: 'Sopa de legumes',
    });
  });

  it('keeps hyphens inside the name', () => {
    expect(decodeMealName('Lanche - Pão - queijo - café')).toEqual({
      mealType: 'SNACK',
      name: 'Pão - queijo - café',
    });
  });

  it('understands old meals saved with only the type', () => {
    expect(decodeMealName('Almoço')).toEqual({ mealType: 'LUNCH', name: null });
    expect(decodeMealName('Café da manhã')).toEqual({ mealType: 'BREAKFAST', name: null });
  });

  it('treats anything else as a free name, without breaking', () => {
    expect(decodeMealName('Sobras de ontem')).toEqual({ mealType: null, name: 'Sobras de ontem' });
    expect(decodeMealName('Almoçou - tarde')).toEqual({ mealType: null, name: 'Almoçou - tarde' });
    expect(decodeMealName('almoço')).toEqual({ mealType: null, name: 'almoço' });
    expect(decodeMealName('')).toEqual({ mealType: null, name: null });
    expect(decodeMealName(null)).toEqual({ mealType: null, name: null });
    expect(decodeMealName('Almoço - ')).toEqual({ mealType: null, name: 'Almoço -' });
  });

  it('round-trips every type with and without name', () => {
    for (const type of ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const) {
      for (const name of [null, 'Arroz, feijão e frango', 'Prato - especial']) {
        expect(decodeMealName(encodeMealName(type, name))).toEqual({ mealType: type, name });
      }
    }
  });
});
