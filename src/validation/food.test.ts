import {
  buildManualFoodInput,
  validateManualFood,
  type ManualFoodForm,
} from './food';

const valid: ManualFoodForm = {
  name: 'Frango à passarinho assado',
  brand: '',
  calories: '218',
  protein: '27',
  carbohydrates: '2',
  fat: '11',
};

describe('validateManualFood', () => {
  it('accepts a complete form (brand is optional)', () => {
    expect(validateManualFood(valid)).toBeNull();
  });

  it('accepts zeros and comma decimals', () => {
    expect(
      validateManualFood({ ...valid, calories: '0', protein: '0', carbohydrates: '0,5', fat: '0' }),
    ).toBeNull();
  });

  it('requires name and every nutrition field', () => {
    expect(validateManualFood({ ...valid, name: '  ' })).toMatch(/nome/);
    expect(validateManualFood({ ...valid, calories: '' })).toMatch(/calorias/);
    expect(validateManualFood({ ...valid, protein: '' })).toMatch(/proteína/);
    expect(validateManualFood({ ...valid, carbohydrates: 'x' })).toMatch(/carboidrato/);
    expect(validateManualFood({ ...valid, fat: '' })).toMatch(/gordura/);
  });

  it('rejects negative values', () => {
    expect(validateManualFood({ ...valid, calories: '-1' })).toMatch(/negativas/);
    expect(validateManualFood({ ...valid, protein: '-1' })).toMatch(/negativa/);
  });

  it('rejects macros that add up to more than 100 g per 100 g', () => {
    expect(
      validateManualFood({ ...valid, protein: '50', carbohydrates: '40', fat: '10' }),
    ).toBeNull();
    expect(
      validateManualFood({ ...valid, protein: '50', carbohydrates: '40', fat: '10,1' }),
    ).toMatch(/100 g/);
  });
});

describe('buildManualFoodInput', () => {
  it('trims text, converts numbers and leaves an empty brand as null', () => {
    expect(buildManualFoodInput({ ...valid, name: ' Frango ', calories: '218,5' })).toEqual({
      name: 'Frango',
      brand: null,
      barcode: null,
      nutritionPer100g: { calories: 218.5, protein: 27, carbohydrates: 2, fat: 11, fiber: 0 },
    });
  });
});
