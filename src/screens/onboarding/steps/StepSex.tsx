import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ChoicePill } from '@/components/ChoicePill';
import { spacing } from '@/theme/tokens';
import { SEX_OPTIONS, type OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function StepSex({ data, onChange }: Props) {
  return (
    <View style={styles.group}>
      {SEX_OPTIONS.map((option) => (
        <ChoicePill
          key={option.value}
          label={option.label}
          selected={data.sex === option.value}
          onPress={() => onChange({ sex: option.value })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
});
