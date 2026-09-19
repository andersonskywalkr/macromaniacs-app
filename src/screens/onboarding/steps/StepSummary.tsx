import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { GOAL_OPTIONS, ACTIVITY_OPTIONS, SEX_OPTIONS, findLabel, type OnboardingData } from '../types';

interface Props {
  data: OnboardingData;
}

// Etapa final de revisão — mostra tudo que foi coletado nas etapas
// anteriores (incluindo a etapa opcional "Últimos detalhes") antes do
// usuário confirmar com "Concluir" (fora deste componente, no rodapé do
// wizard).
export function StepSummary({ data }: Props) {
  const { tokens } = useTheme();

  const rows: { label: string; value: string }[] = [
    { label: 'Como te chamamos', value: data.displayName || '—' },
    { label: 'Data de nascimento', value: data.birthDate || '—' },
    { label: 'Altura', value: data.heightCm ? `${data.heightCm} cm` : '—' },
    { label: 'Peso', value: data.weightKg ? `${data.weightKg} kg` : '—' },
    { label: 'Sexo', value: findLabel(SEX_OPTIONS, data.sex) },
    { label: 'Objetivo', value: findLabel(GOAL_OPTIONS, data.goal) },
    {
      label: 'Nível de atividade',
      value: findLabel(
        ACTIVITY_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
        data.activityLevel,
      ),
    },
    { label: 'Peso-meta', value: data.targetWeightKg ? `${data.targetWeightKg} kg` : '—' },
    { label: 'Prazo desejado', value: data.targetTimeframe || '—' },
    { label: 'Restrições alimentares', value: data.dietaryRestrictions || '—' },
  ];

  return (
    <Card>
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const borderBottomColor = tokens.background;
        return (
          <View key={row.label} style={[styles.row, !isLast && styles.rowDivider, { borderBottomColor }]}>
            <Text style={[styles.label, { color: tokens.textSecondary }]}>{row.label}</Text>
            <Text style={[styles.value, { color: tokens.text }]}>{row.value}</Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    paddingVertical: spacing.sm + spacing.xs,
  },
  rowDivider: {
    borderBottomWidth: 1,
  },
  value: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
});
