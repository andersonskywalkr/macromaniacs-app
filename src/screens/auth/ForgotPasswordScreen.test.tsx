import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { requestPasswordReset } from '@/api/auth';

let mockAuthMock = true;
const mockRequest = jest.mocked(requestPasswordReset);

jest.mock('@/api/config', () => ({
  get USE_AUTH_MOCK() {
    return mockAuthMock;
  },
}));
jest.mock('@/api/auth', () => ({ requestPasswordReset: jest.fn() }));
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
      shadow: '#000',
    },
  }),
}));
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return { ChevronRightIcon: MockIcon, EyeIcon: MockIcon, EyeOffIcon: MockIcon };
});

function renderScreen() {
  const navigation = { goBack: jest.fn(), canGoBack: jest.fn(() => true), navigate: jest.fn() };
  const screen = render(<ForgotPasswordScreen navigation={navigation as never} route={{} as never} />);
  return { navigation, screen };
}

describe('ForgotPasswordScreen (mock auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthMock = true;
    mockRequest.mockResolvedValue({ simulated: true });
  });

  it('shows the demo notice and the e-mail field', () => {
    const { screen } = renderScreen();

    expect(screen.getByText('Modo demonstração')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Enviar instruções')).toBeTruthy();
  });

  it('validates the e-mail before doing anything', () => {
    const { screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Enviar instruções'));
    expect(screen.getByText('Informe o seu e-mail.')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('E-mail'), 'sem-arroba');
    fireEvent.press(screen.getByLabelText('Enviar instruções'));
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('simulates the flow with a clear message that it is a demonstration', async () => {
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByLabelText('E-mail'), ' Ana@Exemplo.com ');
    fireEvent.press(screen.getByLabelText('Enviar instruções'));

    await waitFor(() => expect(mockRequest).toHaveBeenCalledWith('ana@exemplo.com'));
    expect(await screen.findByText('Simulação: se o e-mail existir, enviaremos as instruções.')).toBeTruthy();
    expect(screen.getByText('Modo demonstração')).toBeTruthy();
  });

  it('goes back to the login', () => {
    const { navigation, screen } = renderScreen();
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});

describe('ForgotPasswordScreen (real auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthMock = false;
  });

  it('does not call any route and says the feature is not available yet', () => {
    const { navigation, screen } = renderScreen();

    expect(
      screen.getByText(
        'A recuperação de senha ainda não está disponível. Fale com a equipe do MacroManiacs.',
      ),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Enviar instruções')).toBeNull();
    expect(screen.queryByText('Modo demonstração')).toBeNull();
    expect(mockRequest).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Voltar ao Login'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
