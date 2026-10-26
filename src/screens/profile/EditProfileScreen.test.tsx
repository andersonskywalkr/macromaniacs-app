import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from './EditProfileScreen';

const mockUser = {
  id: 'u1',
  email: 'a@b.c',
  username: 'anderson',
  displayName: 'Anderson',
  dateOfBirth: '1998-04-12',
  biologicalSex: 'MALE',
  goal: 'MAINTAIN',
  activityLevel: 'MODERATE',
  targetWeightKg: null,
  targetDate: null,
  dietaryRestrictions: null,
  currentMeasurement: { id: 'm', heightCm: 178, weightKg: 82, measuredAt: '2026-01-01' },
};

const mockMutateAsync = jest.fn();
const mockSetUser = jest.fn();

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: mockUser, completeOnboarding: mockSetUser }),
}));
jest.mock('@/queries/useUpdateProfile', () => ({
  useUpdateProfile: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
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

type Listener = (event: { preventDefault: () => void; data: { action: unknown } }) => void;

function renderScreen() {
  const listeners: Listener[] = [];
  const navigation = {
    goBack: jest.fn(),
    popTo: jest.fn(),
    dispatch: jest.fn(),
    addListener: jest.fn((_event: string, listener: Listener) => {
      listeners.push(listener);
      return () => undefined;
    }),
  };
  const screen = render(<EditProfileScreen navigation={navigation as never} route={{} as never} />);

  // Simula o React Navigation tentando sair da tela (botão voltar, gesto, Android).
  function tryToLeave() {
    const event = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
    listeners[listeners.length - 1](event);
    return event;
  }

  return { navigation, screen, tryToLeave };
}

function isDisabled(button: { props: { accessibilityState?: { disabled?: boolean } } }) {
  return Boolean(button.props.accessibilityState?.disabled);
}

describe('EditProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is filled with the current data and the three sex options', () => {
    const { screen } = renderScreen();

    expect(screen.getByDisplayValue('Anderson')).toBeTruthy();
    expect(screen.getByDisplayValue('12/04/1998')).toBeTruthy();
    expect(screen.getByDisplayValue('178')).toBeTruthy();
    expect(screen.getByDisplayValue('82')).toBeTruthy();
    expect(screen.getByLabelText('Feminino')).toBeTruthy();
    expect(screen.getByLabelText('Masculino').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Prefiro não informar')).toBeTruthy();
    expect(screen.queryByText(/biológico/i)).toBeNull();
  });

  it('keeps "Salvar alterações" disabled until something changes', () => {
    const { screen } = renderScreen();

    expect(isDisabled(screen.getByLabelText('Salvar alterações'))).toBe(true);

    fireEvent.changeText(screen.getByDisplayValue('82'), '80');
    expect(isDisabled(screen.getByLabelText('Salvar alterações'))).toBe(false);

    fireEvent.changeText(screen.getByDisplayValue('80'), '82');
    expect(isDisabled(screen.getByLabelText('Salvar alterações'))).toBe(true);
  });

  it('shows the validation error in the screen and disables saving', () => {
    const { screen } = renderScreen();

    fireEvent.changeText(screen.getByDisplayValue('82'), '10');

    expect(screen.getByText('Informe um peso entre 25 e 400 kg.')).toBeTruthy();
    expect(isDisabled(screen.getByLabelText('Salvar alterações'))).toBe(true);
  });

  it('saves the whole form, updates the session user and returns to the profile', async () => {
    const updated = { ...mockUser, biologicalSex: 'PREFER_NOT_TO_SAY' };
    mockMutateAsync.mockResolvedValue(updated);
    const { navigation, screen } = renderScreen();

    fireEvent.press(screen.getByLabelText('Prefiro não informar'));
    fireEvent.changeText(screen.getByDisplayValue('82'), '80');
    fireEvent.press(screen.getByLabelText('Salvar alterações'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        biologicalSex: 'PREFER_NOT_TO_SAY',
        currentWeightKg: 80,
        heightCm: 178,
        dateOfBirth: '1998-04-12',
        displayName: 'Anderson',
      }),
    );
    await waitFor(() => expect(mockSetUser).toHaveBeenCalledWith(updated));
    expect(navigation.popTo).toHaveBeenCalledWith('ProfileHome', { saved: true });
  });

  it('keeps what was typed and shows the error when saving fails', async () => {
    mockMutateAsync.mockRejectedValue(new Error('boom'));
    const { navigation, screen } = renderScreen();

    fireEvent.changeText(screen.getByDisplayValue('82'), '80');
    fireEvent.press(screen.getByLabelText('Salvar alterações'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalled());
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByDisplayValue('80')).toBeTruthy();
    expect(navigation.popTo).not.toHaveBeenCalled();
  });

  it('leaves without asking when nothing changed', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { tryToLeave } = renderScreen();

    const event = tryToLeave();

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });

  it('asks to discard or keep editing when leaving with unsaved changes', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { navigation, screen, tryToLeave } = renderScreen();

    fireEvent.changeText(screen.getByDisplayValue('82'), '80');
    const event = tryToLeave();

    expect(event.preventDefault).toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(
      'Descartar alterações?',
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Continuar editando' }),
        expect.objectContaining({ text: 'Descartar' }),
      ]),
    );

    // "Descartar" refaz a saída que tinha sido bloqueada
    const buttons = alert.mock.calls[0][2] ?? [];
    buttons.find((button) => button.text === 'Descartar')?.onPress?.();
    expect(navigation.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    alert.mockRestore();
  });
});
