import {
  formatDecimal,
  parseDecimal,
  scaleNutrition,
  validateAmount,
} from './nutrition';

const chicken = { calories: 159, protein: 32, carbohydrates: 0, fat: 3.6, fiber: 0 };

describe('scaleNutrition', () => {
  it('keeps the per-100g values when the amount is 100 g', () => {
    expect(scaleNutrition(chicken, 100)).toEqual({
      calories: 159,
      protein: 32,
      carbohydrates: 0,
      fat: 3.6,
    });
  });

  it('scales every value proportionally', () => {
    expect(scaleNutrition(chicken, 250)).toEqual({
      calories: 398,
      protein: 80,
      carbohydrates: 0,
      fat: 9,
    });
  });

  it('handles amounts smaller than 100 g', () => {
    expect(scaleNutrition({ ...chicken, protein: 2.5 }, 30)).toMatchObject({
      calories: 48,
      protein: 0.8,
    });
  });
});

describe('validateAmount', () => {
  it('accepts valid amounts, including comma decimals and the 5000 g limit', () => {
    expect(validateAmount('100')).toBeNull();
    expect(validateAmount('0,5')).toBeNull();
    expect(validateAmount('5000')).toBeNull();
  });

  it('rejects empty and non-numeric text', () => {
    expect(validateAmount('')).toMatch(/Informe/);
    expect(validateAmount('abc')).toMatch(/Informe/);
  });

  it('rejects zero and negative amounts', () => {
    expect(validateAmount('0')).toMatch(/maior que zero/);
    expect(validateAmount('-10')).toMatch(/maior que zero/);
  });

  it('rejects amounts above 5000 g', () => {
    expect(validateAmount('5000,1')).toMatch(/5000/);
  });
});

describe('number helpers', () => {
  it('parses comma and dot decimals', () => {
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal(' 2.25 ')).toBe(2.25);
    expect(parseDecimal('1,2,3')).toBeNull();
  });

  it('formats with a comma and at most one decimal', () => {
    expect(formatDecimal(3.6)).toBe('3,6');
    expect(formatDecimal(32)).toBe('32');
    expect(formatDecimal(0.04)).toBe('0');
  });
});
