import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { BarChart, type BarChartPoint } from '@/components/BarChart';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChoicePill } from '@/components/ChoicePill';
import { EmptyState } from '@/components/EmptyState';
import { usePerformance } from '@/queries/useProgressHistory';
import {
  formatShortDate,
  summarizePerformance,
  weekdayShort,
  type DayStatus,
  type PerformanceDay,
} from '@/utils/performance';
import { formatDecimal } from '@/utils/nutrition';

type Props = NativeStackScreenProps<ProfileStackParamList, 'History'>;

type Period = 7 | 30;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: 'Semana' },
  { value: 30, label: 'Mês' },
];

const STATUS_LABEL: Record<DayStatus, string> = {
  hit: 'Meta batida',
  near: 'Perto da meta',
  out: 'Fora da meta',
  none: 'Sem registro',
};

function chartPoints(days: PerformanceDay[], period: Period): BarChartPoint[] {
  return days.map((day, index) => {
    const dayNumber = day.date.slice(8);
    // Semana: dia da semana em toda barra. Mês: número do dia a cada 5 barras.
    const label =
      period === 7 ? weekdayShort(day.date) : index % 5 === 0 || index === days.length - 1 ? dayNumber : '';
    const detail = day.hasRecord
      ? `${Math.round(day.calories)} calorias${day.hit ? ', meta batida' : ''}`
      : 'sem registro';
    return {
      key: day.date,
      label,
      value: day.hasRecord ? day.calories : 0,
      highlight: day.hit,
      accessibilityLabel: `${weekdayShort(day.date)} ${formatShortDate(day.date)}: ${detail}`,
    };
  });
}

// Histórico e desempenho (item 17): barras de calorias por dia com a linha da
// meta, resumo do período e a lista dia a dia. O mesmo cálculo alimenta o
// atalho "Desempenho semanal" da Home (utils/performance.ts).
export function HistoryScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const [period, setPeriod] = useState<Period>(7);
  const [refreshing, setRefreshing] = useState(false);
  const performance = usePerformance(period);

  const statusColor: Record<DayStatus, string> = {
    hit: tokens.fat,
    near: tokens.carbs,
    out: tokens.protein,
    none: tokens.textSecondary,
  };

  function handleBack() {
    if (route.params?.origin === 'home') {
      // Aberto pelo atalho da Home: deixa o Perfil na pilha e volta à Home.
      navigation.reset({ index: 0, routes: [{ name: 'ProfileHome' }] });
      navigation.getParent()?.navigate('HomeTab');
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ProfileHome');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await performance.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function renderBody() {
    if (performance.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando desempenho" />
        </View>
      );
    }
    if (performance.isError || !performance.data) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar o desempenho"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => performance.refetch()} style={styles.fullWidth} />
        </View>
      );
    }

    const days = performance.data;
    const summary = summarizePerformance(days);

    if (summary.recordedDays === 0) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Registre refeições para ver seu desempenho"
            description="Assim que você registrar o que comeu, as barras e os resumos aparecem aqui."
          />
        </View>
      );
    }

    const goal = [...days].reverse().find((day) => day.goal)?.goal ?? null;
    const recordedNewestFirst = days.filter((day) => day.hasRecord).reverse();

    return (
      <>
        <Card style={styles.chartCard}>
          <Text style={[styles.cardTitle, { color: tokens.textSecondary }]}>
            CALORIAS POR DIA
          </Text>
          <BarChart points={chartPoints(days, period)} goal={goal} />
          <Text style={[styles.legend, { color: tokens.textSecondary }]}>
            Barras na cor forte = meta batida (entre 90% e 110% da meta).
          </Text>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: tokens.text }]}>
              {summary.goalHitDays} de {summary.totalDays}
            </Text>
            <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>dias com meta batida</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: tokens.text }]}>{summary.avgCalories} kcal</Text>
            <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>média por dia</Text>
          </Card>
        </View>

        <Card style={styles.chartCard}>
          <Text style={[styles.cardTitle, { color: tokens.textSecondary }]}>MÉDIA DE MACROS</Text>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: tokens.protein }]}>{summary.avgProtein} g</Text>
              <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>proteína</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: tokens.carbs }]}>{summary.avgCarbohydrates} g</Text>
              <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>carboidrato</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: tokens.fat }]}>{summary.avgFat} g</Text>
              <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>gordura</Text>
            </View>
          </View>
        </Card>

        {summary.bestDay && (
          <Card style={styles.chartCard}>
            <Text style={[styles.cardTitle, { color: tokens.textSecondary }]}>MELHOR DIA</Text>
            <Text style={[styles.statValue, { color: tokens.text }]}>
              {weekdayShort(summary.bestDay.date)}, {formatShortDate(summary.bestDay.date)}
            </Text>
            <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>
              {Math.round(summary.bestDay.calories)} kcal
              {summary.bestDay.goal ? ` de uma meta de ${Math.round(summary.bestDay.goal)} kcal` : ''}
            </Text>
          </Card>
        )}

        <Text style={[styles.cardTitle, { color: tokens.textSecondary }]}>DIA POR DIA</Text>
        <View style={styles.list}>
          {recordedNewestFirst.map((day) => (
            <Card
              key={day.date}
              style={styles.dayCard}
              accessible
              accessibilityLabel={`${weekdayShort(day.date)} ${formatShortDate(day.date)}, ${Math.round(day.calories)} calorias, ${STATUS_LABEL[day.status]}`}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: tokens.text }]}>
                  {weekdayShort(day.date)}, {formatShortDate(day.date)}
                </Text>
                <Text style={[styles.dayStatus, { color: statusColor[day.status] }]}>
                  {STATUS_LABEL[day.status]}
                </Text>
              </View>
              <Text style={[styles.dayKcal, { color: tokens.text }]}>
                {Math.round(day.calories)}
                <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>
                  {day.goal ? ` / ${Math.round(day.goal)} kcal` : ' kcal'}
                </Text>
              </Text>
              <Text style={[styles.statLabel, { color: tokens.textSecondary }]}>
                P {formatDecimal(day.protein)} g · C {formatDecimal(day.carbohydrates)} g · G{' '}
                {formatDecimal(day.fat)} g
              </Text>
            </Card>
          ))}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={[styles.title, { color: tokens.text }]}>Desempenho</Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.periods}>
        {PERIODS.map((option) => (
          <ChoicePill
            key={option.value}
            variant="inverted"
            label={option.label}
            selected={period === option.value}
            onPress={() => setPeriod(option.value)}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5, marginBottom: spacing.sm },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  chartCard: { padding: spacing.lg },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  dayCard: { padding: spacing.md },
  dayHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  dayKcal: { fontFamily: fontFamily(800), fontSize: 20, marginVertical: 2 },
  dayStatus: { fontFamily: fontFamily(800), fontSize: 12.5 },
  dayTitle: { fontFamily: fontFamily(700), fontSize: 15 },
  fullWidth: { alignSelf: 'stretch' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  legend: { fontFamily: fontFamily(500), fontSize: 12, marginTop: spacing.md },
  list: { gap: spacing.sm },
  macroItem: { flex: 1 },
  macroRow: { flexDirection: 'row', gap: spacing.md },
  macroValue: { fontFamily: fontFamily(800), fontSize: 20 },
  periods: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  statCard: { flex: 1, padding: spacing.md },
  statLabel: { fontFamily: fontFamily(600), fontSize: 12.5, marginTop: 2 },
  statValue: { fontFamily: fontFamily(800), fontSize: 20 },
  statsGrid: { flexDirection: 'row', gap: spacing.md },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
});
