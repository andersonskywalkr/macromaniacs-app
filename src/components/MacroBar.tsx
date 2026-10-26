import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDecimal } from '@/utils/nutrition';
import { summarizeMacro } from '@/utils/dailyProgress';

interface MacroBarProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
}

// Barra de macro da Home: "atual / meta g" e preenchimento limitado a 100%.
export function MacroBar({ label, consumed, goal, color }: MacroBarProps) {
  const { tokens } = useTheme();
  const summary = summarizeMacro(consumed, goal);
  const valueText = `${formatDecimal(consumed)} / ${formatDecimal(goal)} g`;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${label}: ${formatDecimal(consumed)} de ${formatDecimal(goal)} gramas`}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(100, summary.percent) }}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
        <Text style={[styles.value, { color: tokens.textSecondary }]}>{valueText}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: tokens.track }]}>
        <View
          style={[styles.fill, { backgroundColor: color, width: `${summary.barProgress * 100}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { borderRadius: 999, height: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs + 2 },
  label: { fontFamily: 'PlusJakartaSans', fontSize: 13.5, fontWeight: '700' },
  track: { borderRadius: 999, height: 8, overflow: 'hidden' },
  value: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700' },
});
