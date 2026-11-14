import React from 'react';
import { Alert, FlatList, Image, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AvatarCustomizerScreen } from './AvatarCustomizerScreen';
import { defaultAvatarConfig, type AvatarConfig } from '@/utils/avatarConfig';
import { buildAvatarSvg } from '@/utils/avatarSvg';

let mockConfig: AvatarConfig | null = null;
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
  useMyAvatar: () => ({ config: mockConfig, save: mockSave }),
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

type Listener = (event: { preventDefault: () => void; data: { action: unknown } }) => void;

function renderScreen() {
  const listeners: Listener[] = [];
  const navigation = {
    goBack: jest.fn(),
    dispatch: jest.fn(),
    addListener: jest.fn((_event: string, listener: Listener) => {
      listeners.push(listener);
      return () => undefined;
    }),
  };
  render(<AvatarCustomizerScreen navigation={navigation as never} route={{} as never} />);

  function tryToLeave() {
    const event = { preventDefault: jest.fn(), data: { action: { type: 'GO_BACK' } } };
    listeners[listeners.length - 1](event);
    return event;
  }
  return { navigation, tryToLeave };
}

// Primeiro desenho da tela = o boneco grande (preview).
const previewXml = () => screen.UNSAFE_getAllByType(SvgXml)[0].props.xml as string;

let alertSpy: jest.SpyInstance;

describe('AvatarCustomizerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfig = null;
    mockSave.mockResolvedValue(undefined);
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('opens with the fixed default combination and the eight categories', () => {
    renderScreen();

    expect(previewXml()).toBe(buildAvatarSvg(defaultAvatarConfig(), 128));
    for (const label of ['Pele', 'Cabelo', 'Cor do cabelo', 'Roupa', 'Acessórios', 'Expressão', 'Barba', 'Fundo']) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    expect(screen.getByLabelText('Pele').props.accessibilityState.selected).toBe(true);
  });

  it('opens from the saved avatar when there is one', () => {
    const base = defaultAvatarConfig();
    mockConfig = { ...base, options: { ...base.options, skinColor: '614335' } };
    renderScreen();

    expect(previewXml()).toBe(buildAvatarSvg(mockConfig, 128));
    expect(screen.getByLabelText('Pele, cor 1 de 7, selecionada')).toBeTruthy();
  });

  it('Pele: seven color bubbles, the selected one marked and the preview changes live', () => {
    renderScreen();
    expect(screen.getAllByLabelText(/^Pele, cor \d+ de 7/)).toHaveLength(7);
    expect(screen.getByLabelText('Pele, cor 4 de 7, selecionada')).toBeTruthy(); // edb98a (padrão)
    const before = previewXml();

    fireEvent.press(screen.getByLabelText('Pele, cor 2 de 7'));

    expect(screen.getByLabelText('Pele, cor 2 de 7, selecionada').props.accessibilityState.selected).toBe(true);
    expect(screen.getAllByLabelText(/selecionada/)).toHaveLength(1);
    expect(previewXml()).not.toBe(before);
    expect(previewXml()).toContain('d08b5b');
  });

  it('color bubbles and option tiles have at least 44x44 touch targets', () => {
    renderScreen();
    const bubble = StyleSheet.flatten(screen.getByLabelText('Pele, cor 1 de 7').props.style);
    expect(bubble.width).toBeGreaterThanOrEqual(44);
    expect(bubble.height).toBeGreaterThanOrEqual(44);

    fireEvent.press(screen.getByLabelText('Roupa'));
    const tile = StyleSheet.flatten(screen.getByLabelText('Roupa, opção 1 de 9').props.style);
    expect(tile.width).toBeGreaterThanOrEqual(44);
    expect(tile.height).toBeGreaterThanOrEqual(44);
  });

  it('Cabelo: lists "Sem cabelo" first and renders the thumbnails lazily (not all 35 at once)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Cabelo'));

    expect(screen.getByLabelText('Cabelo, nenhum, opção 1 de 35')).toBeTruthy();
    expect(screen.getByLabelText('Cabelo, opção 2 de 35')).toBeTruthy();
    const rendered = screen.getAllByLabelText(/^Cabelo, (nenhum, )?opção \d+ de 35/);
    expect(rendered.length).toBeLessThan(35);
  });

  it('Cabelo: choosing "Sem cabelo" removes the hair and Cor do cabelo explains it', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Cabelo'));
    const withHair = previewXml();

    fireEvent.press(screen.getByLabelText('Cabelo, nenhum, opção 1 de 35'));

    expect(previewXml()).not.toBe(withHair);
    expect(screen.getByLabelText('Cabelo, nenhum, opção 1 de 35, selecionada')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Cor do cabelo'));
    expect(screen.getByText(/Sem cabelo escolhido/)).toBeTruthy();
  });

  it('Cor do cabelo edits hairColor for hair', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Cor do cabelo'));

    expect(screen.getByText('Editando a cor do cabelo.')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Cor do cabelo, cor \d+ de 10/)).toHaveLength(10);
    const before = previewXml();

    fireEvent.press(screen.getByLabelText('Cor do cabelo, cor 9 de 10')); // c93305
    expect(previewXml()).not.toBe(before);
    expect(previewXml()).toContain('c93305');
  });

  it('Cor do cabelo edits hatColor (and says so) when the top is a hat or veil', () => {
    const base = defaultAvatarConfig();
    mockConfig = { ...base, options: { ...base.options, top: 'hijab' } };
    renderScreen();
    fireEvent.press(screen.getByLabelText('Cor do cabelo'));

    expect(screen.getByText('Editando a cor do chapéu (ou véu).')).toBeTruthy();
    expect(screen.getAllByLabelText(/^Cor do chapéu, cor \d+ de 15/)).toHaveLength(15);
    const before = previewXml();

    fireEvent.press(screen.getByLabelText('Cor do chapéu, cor 13 de 15')); // ff488e
    expect(previewXml()).not.toBe(before);
    expect(previewXml()).toContain('ff488e');
  });

  it('Roupa: shows the print selector only for graphicShirt', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Roupa'));

    expect(screen.getAllByLabelText(/^Roupa, opção \d+ de 9/).length).toBeGreaterThan(0);

    const rowKeys = () =>
      (screen.UNSAFE_getByType(FlatList).props.data as { key: string }[]).map((row) => row.key);
    expect(rowKeys()).not.toContain('graphic-title');

    fireEvent.press(screen.getByLabelText('Roupa, opção 4 de 9')); // graphicShirt
    expect(screen.getByLabelText('Roupa, opção 4 de 9, selecionada')).toBeTruthy();
    expect(rowKeys()).toContain('graphic-title');
    expect(rowKeys()).toContain('clothingGraphic-0');
  });

  it('Acessórios: "Nenhum" first (default), and choosing one changes the avatar', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Acessórios'));

    expect(screen.getByLabelText('Acessórios, nenhum, opção 1 de 8, selecionada')).toBeTruthy();
    const before = previewXml();
    fireEvent.press(screen.getByLabelText('Acessórios, opção 6 de 8')); // sunglasses
    expect(previewXml()).not.toBe(before);
  });

  it('Expressão: three sections (Olhos, Sobrancelhas, Boca)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Expressão'));

    expect(screen.getByText('OLHOS')).toBeTruthy();
    expect(screen.getByLabelText('Olhos, opção 1 de 12')).toBeTruthy();
  });

  it('Barba: "Sem barba" first, and a beard changes the avatar', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Barba'));

    expect(screen.getByLabelText('Barba, nenhum, opção 1 de 6, selecionada')).toBeTruthy();
    const before = previewXml();
    fireEvent.press(screen.getByLabelText('Barba, opção 4 de 6'));
    expect(previewXml()).not.toBe(before);
  });

  it('Fundo: palette with a transparent option', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Fundo'));

    expect(screen.getAllByLabelText(/^Fundo, cor \d+ de 11/)).toHaveLength(11);
    fireEvent.press(screen.getByLabelText('Fundo, cor 11 de 11, transparente'));
    expect(screen.getByLabelText(/^Fundo, cor 11 de 11, selecionada/).props.accessibilityState.selected).toBe(true);
  });

  it('Aleatório draws a valid combination', () => {
    renderScreen();
    const before = previewXml();
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.77);

    fireEvent.press(screen.getByLabelText('Aleatório'));

    expect(previewXml()).not.toBe(before);
    expect(previewXml().startsWith('<svg')).toBe(true);
    random.mockRestore();
  });

  it('Salvar saves the combination, shows feedback and goes back', async () => {
    jest.useFakeTimers();
    try {
      const { navigation } = renderScreen();
      fireEvent.press(screen.getByLabelText('Pele, cor 2 de 7'));

      await act(async () => {
        fireEvent.press(screen.getByLabelText('Salvar'));
      });

      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(mockSave.mock.calls[0][0].options.skinColor).toBe('d08b5b');
      expect(mockSave.mock.calls[0][0]).toMatchObject({ version: 1, style: 'avataaars' });
      expect(screen.getByText('Avatar salvo!')).toBeTruthy();
      expect(navigation.goBack).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(800);
      });
      expect(navigation.goBack).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('Cancelar without changes goes back with no question', () => {
    const { navigation } = renderScreen();

    fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(navigation.goBack).toHaveBeenCalled();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('Cancelar with unsaved changes asks for confirmation and only then discards', () => {
    const { navigation } = renderScreen();
    fireEvent.press(screen.getByLabelText('Pele, cor 2 de 7'));

    fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(alertSpy).toHaveBeenCalledWith('Descartar alterações?', expect.any(String), expect.any(Array));
    expect(navigation.goBack).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    buttons.find((button) => button.text === 'Descartar')?.onPress?.();
    expect(navigation.goBack).toHaveBeenCalledTimes(1);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('asks before leaving with unsaved changes by the back gesture too', () => {
    const { tryToLeave } = renderScreen();

    expect(tryToLeave().preventDefault).not.toHaveBeenCalled(); // nada alterado: sai direto

    fireEvent.press(screen.getByLabelText('Pele, cor 2 de 7'));
    const event = tryToLeave();
    expect(event.preventDefault).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Descartar alterações?', expect.any(String), expect.any(Array));
  });

  it('makes no network request', () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new Error('sem rede')));
    try {
      renderScreen();
      fireEvent.press(screen.getByLabelText('Cabelo'));
      fireEvent.press(screen.getByLabelText('Aleatório'));

      // o avatar é desenhado com SvgXml (gerado no aparelho): nada de imagem remota
      expect(screen.UNSAFE_queryAllByType(Image)).toHaveLength(0);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
