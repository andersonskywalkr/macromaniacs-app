import { fromApiSex, toApiSex } from './sexMapping';

describe('sex mapping', () => {
  it('maps the three app values to the API value and back', () => {
    expect(toApiSex('FEMALE')).toBe('FEMALE');
    expect(toApiSex('MALE')).toBe('MALE');
    expect(toApiSex('PREFER_NOT_TO_SAY')).toBe('PREFER_NOT_TO_SAY');

    expect(fromApiSex('FEMALE')).toBe('FEMALE');
    expect(fromApiSex('MALE')).toBe('MALE');
    expect(fromApiSex('PREFER_NOT_TO_SAY')).toBe('PREFER_NOT_TO_SAY');
  });

  it('turns unknown or missing values into null (profiles saved before keep working)', () => {
    expect(fromApiSex(null)).toBeNull();
    expect(fromApiSex(undefined)).toBeNull();
    expect(fromApiSex('OTHER')).toBeNull();
  });
});
