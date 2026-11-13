import { mockFoods } from '@/mocks/data';
import { searchFoods, suggestFoods } from './foods';

// Modo mock: as mesmas regras (2 a 100 caracteres, ordem e no máximo 8).
describe('food suggestions (mock mode)', () => {
  it('finds "Frango frito" and similar names for "frango fr", starting with the best match', async () => {
    const suggestions = await suggestFoods('frango fr');
    expect(suggestions.map((f) => f.name)).toContain('Frango frito');
    expect(suggestions[0].name).toBe('Frango frito');
  });

  it('puts names that start with the text before names that only contain it', async () => {
    const suggestions = await suggestFoods('frango');
    const names = suggestions.map((f) => f.name);
    // "Peito de frango grelhado" só tem a palavra; "Frango ..." começa com o texto
    expect(names.indexOf('Frango frito')).toBeLessThan(names.indexOf('Peito de frango grelhado'));
    expect(names.indexOf('Frango grelhado')).toBeLessThan(names.indexOf('Peito de frango grelhado'));
  });

  it('ignores case and accents', async () => {
    const names = (await suggestFoods('FEIJAO')).map((f) => f.name);
    expect(names).toContain('Feijão carioca cozido');
  });

  it('returns at most 8', async () => {
    for (let i = 0; i < 12; i += 1) {
      mockFoods.push({
        id: `zz-${i}`,
        name: `Zzteste ${i}`,
        brand: null,
        source: 'MANUAL',
        externalId: null,
        barcode: null,
        nutritionPer100g: { calories: 10, protein: 1, carbohydrates: 1, fat: 1, fiber: 0 },
      });
    }
    expect(await suggestFoods('zzteste')).toHaveLength(8);
    // a busca completa continua devolvendo tudo
    expect((await searchFoods('zzteste')).length).toBeGreaterThanOrEqual(12);
  });
});
