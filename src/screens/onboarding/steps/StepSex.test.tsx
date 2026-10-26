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
  it('has the three options', () => {
    expect(SEX_OPTIONS.map((o) => o.label)).toEqual(['Feminino', 'Masculino', 'Prefiro não informar']);
    expect(SEX_OPTIONS.map((o) => o.value)).toEqual(['FEMALE', 'MALE', 'PREFER_NOT_TO_SAY']);
  });

  it('shows the three pills and the neutral explanation, without "biológico"', () => {
    const onChange = jest.fn();
    const screen = render(<StepSex data={INITIAL_ONBOARDING_DATA} onChange={onChange} />);

    expect(screen.getByLabelText('Feminino')).toBeTruthy();
    expect(screen.getByLabelText('Masculino')).toBeTruthy();
    expect(screen.getByLabelText('Prefiro não informar')).toBeTruthy();
    expect(
      screen.getByText(
        'Usado apenas no cálculo do gasto de energia do corpo. Você pode preferir não informar.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/biológico/i)).toBeNull();

    fireEvent.press(screen.getByLabelText('Prefiro não informar'));
    expect(onChange).toHaveBeenCalledWith({ sex: 'PREFER_NOT_TO_SAY' });
  });

  it('stays required: one of the three must be chosen', () => {
    expect(validateOnboardingStep(1, INITIAL_ONBOARDING_DATA)).toMatch(/Selecione/);
    expect(validateOnboardingStep(1, { ...INITIAL_ONBOARDING_DATA, sex: 'PREFER_NOT_TO_SAY' })).toBeNull();
  });
});
