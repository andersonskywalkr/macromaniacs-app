import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Button } from './Button';

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: { background: '#000', text: '#fff', primary: '#bba0ff', onPrimary: '#fff' },
  }),
}));

function labelProps(label: string) {
  return screen.getByText(label).props;
}

describe('Button label', () => {
  it('stays on one line and shrinks to fit instead of wrapping', () => {
    render(<Button label="Cancelar criação do grupo" onPress={jest.fn()} />);

    const props = labelProps('Cancelar criação do grupo');
    expect(props.numberOfLines).toBe(1);
    expect(props.adjustsFontSizeToFit).toBe(true);
    expect(props.minimumFontScale).toBeGreaterThanOrEqual(0.8);
    expect(props.minimumFontScale).toBeLessThan(1);
  });

  it('is centered and can shrink inside the button', () => {
    render(<Button label="Entrar em grupo" onPress={jest.fn()} />);

    const style = StyleSheet.flatten(labelProps('Entrar em grupo').style);
    expect(style.textAlign).toBe('center');
    expect(style.flexShrink).toBe(1);
    expect(style.fontSize).toBe(16);
  });

  it('keeps the icon next to a one-line label', () => {
    render(<Button label="Adicionar refeição" icon={<Text>+</Text>} onPress={jest.fn()} />);

    expect(screen.getByText('+')).toBeTruthy();
    expect(labelProps('Adicionar refeição').numberOfLines).toBe(1);
  });

  it('shows only the spinner while loading, without the label text', () => {
    render(<Button label="Salvar" loading onPress={jest.fn()} />);

    expect(screen.queryByText('Salvar')).toBeNull();
    expect(screen.getByLabelText('Salvar').props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });
});
