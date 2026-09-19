import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextField } from '@/components/TextField';
import { spacing } from '@/theme/tokens';
import type { OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}

// Máscara dd/mm/aaaa — só dígitos, barras inseridas automaticamente
// conforme a pessoa digita (e também funcionam corretamente com backspace,
// já que sempre reconstrói a partir dos dígitos brutos).
function formatBirthDate(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join('/');
}

export function StepBasicInfo({ data, onChange }: Props) {
  return (
    <View style={styles.group}>
      <TextField
        accessibilityLabel="Como gostaria de ser chamado"
        placeholder="Como gostaria de ser chamado"
        value={data.displayName}
        onChangeText={(v) => onChange({ displayName: v })}
      />
      <TextField
        accessibilityLabel="Data de nascimento, formato dia, mês, ano"
        placeholder="Data de nascimento (dd/mm/aaaa)"
        value={data.birthDate}
        onChangeText={(v) => onChange({ birthDate: formatBirthDate(v) })}
        keyboardType="number-pad"
        maxLength={10}
      />
      <View style={styles.row}>
        <TextField
          accessibilityLabel="Altura em centímetros"
          placeholder="Altura (cm)"
          value={data.heightCm}
          onChangeText={(v) => onChange({ heightCm: v.replace(/[^0-9]/g, '') })}
          keyboardType="number-pad"
          style={styles.half}
        />
        <TextField
          accessibilityLabel="Peso em quilogramas"
          placeholder="Peso (kg)"
          value={data.weightKg}
          onChangeText={(v) => onChange({ weightKg: v.replace(/[^0-9.,]/g, '') })}
          keyboardType="decimal-pad"
          style={styles.half}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  half: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.md },
});
