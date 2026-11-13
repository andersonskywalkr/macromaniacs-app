import React from 'react';
import { Platform, Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { KeyboardAvoidingView, KeyboardAwareScrollView as ControllerScroll } from 'react-native-keyboard-controller';
import {
  FIELD_MARGIN,
  KeyboardAwareFooter,
  KeyboardAwareScreen,
  KeyboardAwareScrollView,
} from './KeyboardAwareScreen';

// O react-native-keyboard-controller é mockado (jest.setup.js). Aqui só se
// confere como o app usa a biblioteca; a altura real do teclado só dá para
// conferir no celular.
describe('KeyboardAwareScreen', () => {
  it('uses the keyboard controller avoiding view with padding and automatic offset', () => {
    const screen = render(
      <KeyboardAwareScreen>
        <Text>conteúdo</Text>
      </KeyboardAwareScreen>,
    );

    expect(screen.getByText('conteúdo')).toBeTruthy();
    const avoiding = screen.UNSAFE_getByType(KeyboardAvoidingView);
    expect(avoiding.props.behavior).toBe('padding');
    // descobre sozinho onde fica na janela (barra de abas, cabeçalho, área segura)
    expect(avoiding.props.automaticOffset).toBe(true);
  });
});

describe('KeyboardAwareScrollView', () => {
  it('keeps taps working with the keyboard open, closes it when scrolling and keeps a margin above the keyboard', () => {
    const screen = render(
      <KeyboardAwareScreen>
        <KeyboardAwareScrollView>
          <TextInput accessibilityLabel="campo" />
        </KeyboardAwareScrollView>
      </KeyboardAwareScreen>,
    );

    const scroll = screen.UNSAFE_getByType(ControllerScroll);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
    expect(scroll.props.keyboardDismissMode).toBe(Platform.OS === 'ios' ? 'interactive' : 'on-drag');
    expect(scroll.props.bottomOffset).toBeGreaterThanOrEqual(16);
  });

  it('lets the screen override the defaults', () => {
    const screen = render(<KeyboardAwareScrollView bottomOffset={40} keyboardShouldPersistTaps="always" />);
    const scroll = screen.UNSAFE_getByType(ControllerScroll);
    expect(scroll.props.bottomOffset).toBe(40);
    expect(scroll.props.keyboardShouldPersistTaps).toBe('always');
  });
});

describe('footer between the list and the keyboard', () => {
  function renderWithFooter() {
    return render(
      <KeyboardAwareScreen>
        <KeyboardAwareScrollView>
          <TextInput accessibilityLabel="restrições alimentares" />
        </KeyboardAwareScrollView>
        <KeyboardAwareFooter>
          <Text>Salvar alterações</Text>
        </KeyboardAwareFooter>
      </KeyboardAwareScreen>,
    );
  }

  it('adds the footer height to the margin so the focused field does not hide behind it', () => {
    const screen = renderWithFooter();
    expect(screen.UNSAFE_getByType(ControllerScroll).props.bottomOffset).toBe(FIELD_MARGIN);

    fireEvent(screen.getByText('Salvar alterações').parent as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 88 } },
    });

    expect(screen.UNSAFE_getByType(ControllerScroll).props.bottomOffset).toBe(FIELD_MARGIN + 88);
  });

  it('follows the footer growing (e.g. an error message above the button)', () => {
    const screen = renderWithFooter();
    const footer = screen.getByText('Salvar alterações').parent as never;

    fireEvent(footer, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 88 } } });
    fireEvent(footer, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 130 } } });

    expect(screen.UNSAFE_getByType(ControllerScroll).props.bottomOffset).toBe(FIELD_MARGIN + 130);
  });

  it('goes back to the plain margin when the footer disappears', () => {
    const screen = renderWithFooter();
    fireEvent(screen.getByText('Salvar alterações').parent as never, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 360, height: 88 } },
    });

    screen.rerender(
      <KeyboardAwareScreen>
        <KeyboardAwareScrollView>
          <TextInput accessibilityLabel="restrições alimentares" />
        </KeyboardAwareScrollView>
      </KeyboardAwareScreen>,
    );

    expect(screen.UNSAFE_getByType(ControllerScroll).props.bottomOffset).toBe(FIELD_MARGIN);
  });
});
