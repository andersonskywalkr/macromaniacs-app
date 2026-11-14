import { fromApiSex, toApiSex } from './sexMapping';

describe('sex mapping', () => {
  it('sends only FEMALE or MALE', () => {
    expect(toApiSex('FEMALE')).toBe('FEMALE');
    expect(toApiSex('MALE')).toBe('MALE');
  });

  it('reads FEMALE and MALE from the backend', () => {
    expect(fromApiSex('FEMALE')).toBe('FEMALE');
    expect(fromApiSex('MALE')).toBe('MALE');
  });

  it('reads NOT_INFORMED (old accounts) as "no sex": null, to be completed in Editar perfil', () => {
    expect(fromApiSex('NOT_INFORMED')).toBeNull();
  });

  it('turns unknown or missing values into null (profiles saved before keep working)', () => {
    expect(fromApiSex(null)).toBeNull();
    expect(fromApiSex(undefined)).toBeNull();
    expect(fromApiSex('OTHER')).toBeNull();
    expect(fromApiSex('PREFER_NOT_TO_SAY')).toBeNull();
  });

  it('never produces NOT_INFORMED to send', () => {
    for (const sex of ['FEMALE', 'MALE'] as const) {
      expect(toApiSex(sex)).not.toBe('NOT_INFORMED');
    }
  });
});
