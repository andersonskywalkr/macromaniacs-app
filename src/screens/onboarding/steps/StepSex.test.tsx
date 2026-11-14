import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { StepSex } from './StepSex';
import { INITIAL_ONBOARDING_DATA, SEX_OPTIONS } from '../types';
import { validateOnboardingStep } from '@/validation/onboarding';

jest.mock('@/theme/ThemeProvider', () => ({
  useTheme: () => ({
    tokens: {
      background: '#000',
      card: '#111',
      text: '#fff',
      textSecondary: '#aaa',
      primary: '#bba0ff',
    },
  }),
}));

describe('sex field', () => {
  it('has only two options: female and male', () => {
    expect(SEX_OPTIONS.map((o) => o.label)).toEqual(['Feminino', 'Masculino']);
    expect(SEX_OPTIONS.map((o) => o.value)).toEqual(['FEMALE', 'MALE']);
  });

  it('shows the two pills and the explanation, without "Prefiro não informar" or "biológico"', () => {
    const onChange = jest.fn();
    const screen = render(<StepSex data={INITIAL_ONBOARDING_DATA} onChange={onChange} />);

    expect(screen.getByLabelText('Feminino')).toBeTruthy();
    expect(screen.getByLabelText('Masculino')).toBeTruthy();
    expect(screen.queryByLabelText('Prefiro não informar')).toBeNull();
    expect(
      screen.getByText('Obrigatório: usado para calcular o seu gasto de energia e a sua meta de calorias.'),
    ).toBeTruthy();
    expect(screen.queryByText(/biológico/i)).toBeNull();
    expect(screen.queryByText(/preferir não informar/i)).toBeNull();

    fireEvent.press(screen.getByLabelText('Masculino'));
    expect(onChange).toHaveBeenCalledWith({ sex: 'MALE' });
  });

  it('starts with nothing selected', () => {
    const screen = render(<StepSex data={INITIAL_ONBOARDING_DATA} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Feminino').props.accessibilityState.selected).toBe(false);
    expect(screen.getByLabelText('Masculino').props.accessibilityState.selected).toBe(false);
  });

  it('is required: blocks the step with a clear message until one is chosen', () => {
    expect(validateOnboardingStep(1, INITIAL_ONBOARDING_DATA)).toBe('Selecione feminino ou masculino para continuar.');
    expect(validateOnboardingStep(1, { ...INITIAL_ONBOARDING_DATA, sex: 'FEMALE' })).toBeNull();
    expect(validateOnboardingStep(1, { ...INITIAL_ONBOARDING_DATA, sex: 'MALE' })).toBeNull();
  });
});
