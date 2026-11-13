import { validateForgotPassword, validateLogin, validateRegister } from './auth';

describe('forgot password validation', () => {
  it('needs a valid e-mail', () => {
    expect(validateForgotPassword('ana@exemplo.com')).toBeNull();
    expect(validateForgotPassword('  ana@exemplo.com ')).toBeNull();
    expect(validateForgotPassword('')).toBe('Informe o seu e-mail.');
    expect(validateForgotPassword('ana@')).toBe('Informe um e-mail válido.');
    expect(validateForgotPassword('ana exemplo.com')).toBe('Informe um e-mail válido.');
  });
});

describe('auth form validation', () => {
  const validRegister = {
    email: 'user@example.com',
    username: 'macro_user',
    password: 'strong-password-123',
    confirmPassword: 'strong-password-123',
    termsAccepted: true,
  };

  it('accepts a valid login', () => {
    expect(
      validateLogin({ identifier: 'macro_user', password: 'password-123' }),
    ).toBeNull();
  });

  it('rejects an incomplete login', () => {
    expect(validateLogin({ identifier: '', password: '' })).toContain(
      'Preencha',
    );
  });

  it('accepts a valid registration', () => {
    expect(validateRegister(validRegister)).toBeNull();
  });

  it('rejects an invalid email', () => {
    expect(validateRegister({ ...validRegister, email: 'invalid' })).toContain(
      'e-mail válido',
    );
  });

  it('rejects an invalid username', () => {
    expect(
      validateRegister({ ...validRegister, username: 'invalid user' }),
    ).toContain('3 a 50');
  });

  it('rejects mismatched passwords', () => {
    expect(
      validateRegister({ ...validRegister, confirmPassword: 'different' }),
    ).toContain('não coincidem');
  });

  it('requires acceptance of terms', () => {
    expect(
      validateRegister({ ...validRegister, termsAccepted: false }),
    ).toContain('aceitar os termos');
  });
});
