export type LoginForm = {
  identifier: string;
  password: string;
};

export type RegisterForm = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};

export function validateLogin(form: LoginForm): string | null {
  if (!form.identifier.trim() || !form.password) {
    return 'Preencha usuário/e-mail e senha.';
  }

  if (form.identifier.trim().length < 3) {
    return 'Informe um usuário ou e-mail válido.';
  }

  if (form.password.length < 8 || form.password.length > 128) {
    return 'A senha deve ter entre 8 e 128 caracteres.';
  }

  return null;
}

export function validateRegister(form: RegisterForm): string | null {
  if (
    !form.email.trim() ||
    !form.username.trim() ||
    !form.password ||
    !form.confirmPassword
  ) {
    return 'Preencha todos os campos.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return 'Informe um e-mail válido.';
  }

  if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username.trim())) {
    return 'O usuário deve ter de 3 a 30 caracteres, usando letras, números ou _.';
  }

  if (form.password.length < 8 || form.password.length > 128) {
    return 'A senha deve ter entre 8 e 128 caracteres.';
  }

  if (form.password !== form.confirmPassword) {
    return 'As senhas não coincidem.';
  }

  if (!form.termsAccepted) {
    return 'Você precisa aceitar os termos para criar a conta.';
  }

  return null;
}
