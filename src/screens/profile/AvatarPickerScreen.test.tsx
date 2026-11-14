import React from 'react';
import { Image } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AvatarPickerScreen } from './AvatarPickerScreen';

let mockChoice: { style: string; seed: string } | null = null;
const mockSave = jest.fn();

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: {
      background: '#000',
      card: '#111',
      text: '#fff',
      textSecondary: '#aaa',
      primary: '#bba0ff',
      onPrimary: '#fff',
    },
  }),
}));
jest.mock('@/hooks/useMyAvatar', () => ({
  useMyAvatar: () => ({ choice: mockChoice, save: mockSave }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { id: 'me', username: 'anderson', displayName: 'Anderson Lima' } }),
}));
jest.mock('@/components/icons', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: MockView } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockIcon = () => ReactModule.createElement(MockView);
  return { CheckIcon: MockIcon, ChevronRightIcon: MockIcon };
});

function renderPicker() {
  const navigation = { goBack: jest.fn() };
  render(<AvatarPickerScreen navigation={navigation as never} route={{} as never} />);
  return navigation;
}

describe('AvatarPickerScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockChoice = null;
    mockSave.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows 12 options and the four styles, with Salvar disabled until one is picked', () => {
    renderPicker();

    expect(screen.getAllByLabelText(/^Avatar \d+ de 12/)).toHaveLength(12);
    for (const label of ['Avataaars', 'Adventurer', 'Big Smile', 'Fun Emoji']) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByLabelText('Salvar').props.accessibilityState.disabled).toBe(true);
  });

  it('marks the picked option as selected (not only by color) and enables Salvar', () => {
    renderPicker();

    fireEvent.press(screen.getByLabelText('Avatar 3 de 12'));

    const picked = screen.getByLabelText('Avatar 3 de 12, selecionado');
    expect(picked.props.accessibilityState.selected).toBe(true);
    expect(screen.getAllByLabelText(/selecionado/)).toHaveLength(1);
    expect(screen.getByLabelText('Salvar').props.accessibilityState.disabled).toBe(false);
  });

  it('saves the picked option with the current style and goes back', async () => {
    const navigation = renderPicker();

    fireEvent.press(screen.getByLabelText('Big Smile'));
    fireEvent.press(screen.getByLabelText('Avatar 5 de 12'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Salvar'));
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    const saved = mockSave.mock.calls[0][0];
    expect(saved.style).toBe('big-smile');
    expect(saved.seed).toMatch(/^[a-z0-9]{12}$/);
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('Cancelar goes back without saving', () => {
    const navigation = renderPicker();

    fireEvent.press(screen.getByLabelText('Avatar 2 de 12'));
    fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(mockSave).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('"Sortear novos" draws 12 new options and clears the selection', () => {
    renderPicker();
    fireEvent.press(screen.getByLabelText('Avatar 1 de 12'));
    expect(screen.getAllByLabelText(/selecionado/)).toHaveLength(1);

    fireEvent.press(screen.getByLabelText('Sortear novos'));

    expect(screen.getAllByLabelText(/^Avatar \d+ de 12/)).toHaveLength(12);
    expect(screen.queryAllByLabelText(/selecionado/)).toHaveLength(0);
    expect(screen.getByLabelText('Salvar').props.accessibilityState.disabled).toBe(true);
  });

  it('asks for the 12 images staggered, not all at once (PNG limit of 10 per second)', () => {
    renderPicker();
    // índice 0 pede na hora; os demais, um a um
    const images = () => screen.UNSAFE_queryAllByType(Image);
    expect(images().length).toBeLessThanOrEqual(1);

    act(() => {
      jest.advanceTimersByTime(130 * 4);
    });
    expect(images().length).toBeGreaterThan(1);
    expect(images().length).toBeLessThan(12);

    act(() => {
      jest.advanceTimersByTime(130 * 12);
    });
    expect(images()).toHaveLength(12);
  });

  it('shows the current avatar as the first option, already selected', () => {
    mockChoice = { style: 'fun-emoji', seed: 'abc123def456' };
    renderPicker();

    expect(screen.getByLabelText('Avatar 1 de 12, selecionado')).toBeTruthy();
    expect(screen.getByLabelText('Fun Emoji').props.accessibilityState.selected).toBe(true);
  });

  it('shows a retry when images fail, keeping the initials', () => {
    renderPicker();
    act(() => {
      jest.advanceTimersByTime(130 * 12);
    });

    const [first] = screen.UNSAFE_queryAllByType(Image);
    fireEvent(first, 'error');

    expect(screen.getByText(/Não foi possível carregar alguns avatares/)).toBeTruthy();
    expect(screen.getAllByText('AL').length).toBeGreaterThan(0);

    fireEvent.press(screen.getByLabelText('Tentar de novo'));
    expect(screen.queryByText(/Não foi possível carregar alguns avatares/)).toBeNull();
  });
});
