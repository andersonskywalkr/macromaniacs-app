import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChoicePill } from '@/components/ChoicePill';
import { spacing } from '@/theme/tokens';
import { GOAL_LABELS, GOAL_OPTIONS, type OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function StepGoal({ data, onChange }: Props) {
  return (
    <View style={styles.group}>
      {GOAL_OPTIONS.map((option) => (
        <ChoicePill
          key={option.value}
          label={option.label}
          selected={data.goal === option.value}
          onPress={() => onChange({ goal: option.value })}
        />
      ))}
      {/* Recomposição existe no backend, mas não é opção do Onboarding: só
          aparece (selecionada) para quem já tem esse objetivo no perfil. */}
      {data.goal === 'RECOMPOSITION' && (
        <ChoicePill label={GOAL_LABELS.RECOMPOSITION} selected onPress={() => undefined} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
});
