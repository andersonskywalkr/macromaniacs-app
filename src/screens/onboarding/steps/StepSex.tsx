import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChoicePill } from '@/components/ChoicePill';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { SEX_OPTIONS, type OnboardingData } from '../types';

import { fontFamily } from '@/theme/fonts';
interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

export function StepSex({ data, onChange }: Props) {
  const { tokens } = useTheme();

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

      <Text style={[styles.notice, { color: tokens.textSecondary }]}>
        Obrigatório: usado para calcular o seu gasto de energia e a sua meta de calorias.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  notice: {
    fontFamily: fontFamily(600),
    fontSize: 12.5,
    lineHeight: 17,
    paddingHorizontal: spacing.xs,
  },
});
