import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextField } from '@/components/TextField';
import { spacing } from '@/theme/tokens';
import type { OnboardingData } from '../types';

function formatDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join('/');
}

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

// Etapa opcional (pode pular) — formato já fechado com backend/DB.
export function StepGoalDetails({ data, onChange }: Props) {
  return (
    <View style={styles.group}>
      <TextField
        accessibilityLabel="Peso-meta em quilogramas"
        placeholder="Peso-meta (kg)"
        value={data.targetWeightKg}
        onChangeText={(v) => onChange({ targetWeightKg: v.replace(/[^0-9.,]/g, '') })}
        keyboardType="decimal-pad"
      />
      <TextField
        accessibilityLabel="Data-meta, formato dia, mês, ano"
        placeholder="Data-meta (dd/mm/aaaa)"
        value={data.targetDate}
        onChangeText={(v) => onChange({ targetDate: formatDate(v) })}
        keyboardType="number-pad"
        maxLength={10}
      />
      <TextField
        accessibilityLabel="Restrições alimentares"
        placeholder="Restrições alimentares"
        value={data.dietaryRestrictions}
        onChangeText={(v) => onChange({ dietaryRestrictions: v })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
});
