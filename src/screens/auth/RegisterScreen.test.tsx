import React from 'react';
import { Linking } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { RegisterScreen } from './RegisterScreen';
import { login, register } from '@/api/auth';
import { DEFAULT_TERMS_URL, TERMS_URL, TERMS_VERSION } from '@/api/config';

const mockRegister = jest.mocked(register);
const mockLogin = jest.mocked(login);
const mockSignIn = jest.fn();

jest.mock('@/api/auth', () => ({ register: jest.fn(), login: jest.fn() }));
jest.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => ({ signIn: mockSignIn }) },
}));
jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: {
      background: '#000',
      card: '#111',
      text: '#fff',
      textSecondary: '#aaa',
      primary: '#bba0ff',
      onPrimary: '#fff',
      danger: '#f88',
      track: '#222',
      shadow: '#000',
    },
  }),
}));
jest.mock('@/components/MascotIllustration', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  return { MascotIllustration: () => ReactModule.createElement(MockView) };
});
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return { GoogleIcon: MockIcon, EyeIcon: MockIcon, EyeOffIcon: MockIcon, ChevronRightIcon: MockIcon };
});

const CHECKBOX = 'Aceitar os termos de uso e a política de privacidade';
const LINK = 'Termos de Uso e a Política de Privacidade';
const ERROR_TEXT = 'Não foi possível abrir o documento. Tente novamente com internet.';

let openURL: jest.SpyInstance;

function renderScreen() {
  const navigation = { navigate: jest.fn() };
  const screen = render(<RegisterScreen navigation={navigation as never} route={{} as never} />);
  return { navigation, screen };
}

function fillForm(screen: ReturnType<typeof renderScreen>['screen']) {
  fireEvent.changeText(screen.getByLabelText('Nome de usuário'), 'anderson');
  fireEvent.changeText(screen.getByLabelText('Email'), 'a@b.co');
  fireEvent.changeText(screen.getByLabelText('Senha'), 'senha1234');
  fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha1234');
}

const isChecked = (screen: ReturnType<typeof renderScreen>['screen']) =>
  screen.getByLabelText(CHECKBOX).props.accessibilityState.checked;

describe('RegisterScreen terms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    mockRegister.mockResolvedValue(undefined as never);
    mockLogin.mockResolvedValue({ accessToken: 'token' } as never);
  });

  afterEach(() => {
    openURL.mockRestore();
  });

  it('shows "Li e aceito os" with the link and the terms version', () => {
    const { screen } = renderScreen();

    expect(screen.getByText('Li e aceito os')).toBeTruthy();
    expect(screen.getByText(LINK)).toBeTruthy();
    expect(screen.getByLabelText(LINK).props.accessibilityRole).toBe('link');
    expect(screen.getByText(`Versão ${TERMS_VERSION}`)).toBeTruthy();
    expect(screen.queryByText('Aceito os termos de uso')).toBeNull();
  });

  it('opens the document with TERMS_URL and does not change the checkbox', () => {
    const { screen } = renderScreen();

    expect(isChecked(screen)).toBe(false);
    fireEvent.press(screen.getByLabelText(LINK));
    expect(openURL).toHaveBeenCalledWith(TERMS_URL);
    expect(isChecked(screen)).toBe(false);

    fireEvent.press(screen.getByLabelText(CHECKBOX));
    expect(isChecked(screen)).toBe(true);
    fireEvent.press(screen.getByLabelText(LINK));
    expect(isChecked(screen)).toBe(true);
  });

  it('toggles the checkbox when the rest of the line is pressed', () => {
    const { screen } = renderScreen();

    fireEvent.press(screen.getByText('Li e aceito os'));
    expect(isChecked(screen)).toBe(true);
    fireEvent.press(screen.getByLabelText(CHECKBOX));
    expect(isChecked(screen)).toBe(false);
  });

  it('has the accessibility hint saying the link opens the document', () => {
    const { screen } = renderScreen();

    expect(screen.getByLabelText(CHECKBOX).props.accessibilityHint).toMatch(/abre o documento/);
    expect(screen.getByLabelText(LINK).props.accessibilityHint).toMatch(/Abre o documento/);
  });

  it('shows a discreet message when the document does not open, and does not block signing up', async () => {
    openURL.mockRejectedValue(new Error('sem navegador'));
    const { screen } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(LINK));
    });
    expect(screen.getByText(ERROR_TEXT)).toBeTruthy();

    fillForm(screen);
    fireEvent.press(screen.getByLabelText(CHECKBOX));
    fireEvent.press(screen.getByLabelText('Criar conta'));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
  });

  it('clears the message when the link is pressed again and it opens', async () => {
    openURL.mockRejectedValueOnce(new Error('sem internet'));
    const { screen } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(LINK));
    });
    expect(screen.getByText(ERROR_TEXT)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(LINK));
    });
    expect(screen.queryByText(ERROR_TEXT)).toBeNull();
  });

  it('still requires the checkbox to create the account', async () => {
    const { screen } = renderScreen();

    fillForm(screen);
    fireEvent.press(screen.getByLabelText('Criar conta'));

    expect(await screen.findByText('Você precisa aceitar os termos para criar a conta.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('sends termsAccepted: true and no version to the backend', async () => {
    const { screen } = renderScreen();

    fillForm(screen);
    fireEvent.press(screen.getByLabelText(CHECKBOX));
    fireEvent.press(screen.getByLabelText('Criar conta'));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith({
      email: 'a@b.co',
      username: 'anderson',
      password: 'senha1234',
      termsAccepted: true,
    });
    expect(JSON.stringify(mockRegister.mock.calls)).not.toContain(TERMS_VERSION);
    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('token'));
  });

  it('uses the default public address when EXPO_PUBLIC_TERMS_URL is not set', () => {
    expect(TERMS_URL).toBe(DEFAULT_TERMS_URL);
    expect(DEFAULT_TERMS_URL).toContain('docs/legal/MacroManiacs_Termos_de_Aceite.pdf');
  });
});
