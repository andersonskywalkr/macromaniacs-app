import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextField } from '@/components/TextField';
import { spacing } from '@/theme/tokens';
import type { OnboardingData } from '../types';

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
        accessibilityLabel="Prazo desejado"
        placeholder="Prazo desejado"
        value={data.targetTimeframe}
        onChangeText={(v) => onChange({ targetTimeframe: v })}
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
