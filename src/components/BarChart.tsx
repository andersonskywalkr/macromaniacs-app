import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';

export interface BarChartPoint {
  key: string;
  // Rótulo do eixo (vazio = sem rótulo nessa barra).
  label: string;
  value: number;
  // Destaque (ex.: meta batida).
  highlight?: boolean;
  accessibilityLabel: string;
}

interface BarChartProps {
  points: BarChartPoint[];
  // Linha da meta (null = sem linha).
  goal: number | null;
  goalLabel?: string;
  height?: number;
}

// Gráfico de barras simples feito com Views (sem biblioteca de gráficos):
// uma barra por dia e uma linha pontilhada na meta. Dia sem registro fica com
// barra vazia (só o fundo).
export function BarChart({ points, goal, goalLabel = 'Meta', height = 160 }: BarChartProps) {
  const { tokens } = useTheme();
  const maxValue = Math.max(goal ?? 0, ...points.map((point) => point.value));
  // folga de 20% acima da maior barra / da meta
  const scaleMax = maxValue > 0 ? maxValue * 1.2 : 1;
  const goalBottom = goal ? (goal / scaleMax) * height : null;

  return (
    <View>
      <View style={[styles.plot, { height }]}>
        {goalBottom !== null && (
          <View
            pointerEvents="none"
            style={[styles.goalLine, { borderTopColor: tokens.textSecondary, bottom: goalBottom }]}
          >
            <Text style={[styles.goalLabel, { backgroundColor: tokens.background, color: tokens.textSecondary }]}>
              {goalLabel}
            </Text>
          </View>
        )}
        <View style={styles.bars}>
          {points.map((point) => {
            const barHeight = point.value > 0 ? Math.max(3, (point.value / scaleMax) * height) : 0;
            const color = point.highlight ? tokens.primary : tokens.ring;
            return (
              <View
                key={point.key}
                accessible
                accessibilityLabel={point.accessibilityLabel}
                style={styles.column}
              >
                <View style={[styles.barTrack, { backgroundColor: tokens.card }]}>
                  <View style={[styles.bar, { backgroundColor: color, height: barHeight }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.labels}>
        {points.map((point) => (
          <Text
            key={point.key}
            numberOfLines={1}
            style={[styles.label, { color: tokens.textSecondary }]}
          >
            {point.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderRadius: 4, width: '100%' },
  barTrack: { borderRadius: 4, flex: 1, justifyContent: 'flex-end', width: '100%' },
  bars: { flex: 1, flexDirection: 'row', gap: 3 },
  column: { alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  goalLabel: {
    fontFamily: fontFamily(700),
    fontSize: 10.5,
    paddingHorizontal: 4,
    position: 'absolute',
    right: 0,
    top: -9,
  },
  goalLine: {
    borderStyle: 'dashed',
    borderTopWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  label: { flex: 1, fontFamily: fontFamily(600), fontSize: 10.5, marginTop: spacing.xs, textAlign: 'center' },
  labels: { flexDirection: 'row', gap: 3 },
  plot: { justifyContent: 'flex-end' },
});
