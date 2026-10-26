import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealsStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useMealsToday } from '@/queries/useMealsToday';
import {
  formatTime,
  itemsCountLabel,
  mealTotals,
  mealTitle,
  mealTypeLabel,
} from '@/utils/meals';
import { formatDecimal } from '@/utils/nutrition';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealReview'>;

// Detalhe da refeição (item 11), logo após salvar ou aberto pela lista. Lê
// da lista de hoje (useMealsToday), que já recebe a refeição nova ao salvar.
export function MealReviewScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const meals = useMealsToday();
  const meal = meals.data?.find((m) => m.id === route.params.mealId);

  function goToList() {
    navigation.reset({ index: 0, routes: [{ name: 'MealsHome' }] });
  }

  function renderBody() {
    if (meals.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando refeição" />
        </View>
      );
    }

    if (meals.isError) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar a refeição"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => meals.refetch()} style={styles.fullWidth} />
        </View>
      );
    }

    if (!meal) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Refeição não encontrada"
            description="Ela pode ter sido removida ou não é de hoje."
          />
        </View>
      );
    }

    const totals = mealTotals(meal);

    return (
      <>
        <View style={styles.titleRow}>
          <Text style={[styles.mealName, { color: tokens.text }]}>{mealTitle(meal)}</Text>
          {meal.name && meal.mealType && <Badge label={mealTypeLabel(meal.mealType)} />}
        </View>
        <Text style={[styles.mealTime, { color: tokens.textSecondary }]}>
          Hoje às {formatTime(meal.consumedAt)} · {itemsCountLabel(meal.items.length)}
        </Text>

        <Card style={styles.totalsCard}>
          <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>TOTAL DA REFEIÇÃO</Text>
          <Text
            accessibilityLabel={`${totals.calories} calorias no total`}
            style={[styles.calories, { color: tokens.text }]}
          >
            {totals.calories}
            <Text style={[styles.caloriesUnit, { color: tokens.textSecondary }]}> kcal</Text>
          </Text>
          <View style={styles.macroRow}>
            <Text style={[styles.totalMacro, { color: tokens.protein }]}>
              P {formatDecimal(totals.protein)} g
            </Text>
            <Text style={[styles.totalMacro, { color: tokens.carbs }]}>
              C {formatDecimal(totals.carbohydrates)} g
            </Text>
            <Text style={[styles.totalMacro, { color: tokens.fat }]}>
              G {formatDecimal(totals.fat)} g
            </Text>
          </View>
        </Card>

        <Text style={[styles.sectionTitle, styles.itemsTitle, { color: tokens.textSecondary }]}>
          ITENS
        </Text>
        <View style={styles.list}>
          {meal.items.map((item) => (
            <Card key={item.id}>
              <Text style={[styles.itemName, { color: tokens.text }]}>{item.foodName}</Text>
              <Text style={[styles.itemDetail, { color: tokens.textSecondary }]}>
                {formatDecimal(item.amountGrams)} g · {Math.round(item.calories)} kcal
              </Text>
              <View style={styles.macroRow}>
                <Text style={[styles.macro, { color: tokens.protein }]}>
                  P {formatDecimal(item.protein)} g
                </Text>
                <Text style={[styles.macro, { color: tokens.carbs }]}>C {formatDecimal(item.carbs)} g</Text>
                <Text style={[styles.macro, { color: tokens.fat }]}>G {formatDecimal(item.fat)} g</Text>
              </View>
            </Card>
          ))}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={goToList} />
        <Text style={[styles.title, { color: tokens.text }]}>Detalhe da refeição</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>{renderBody()}</ScrollView>

      <View style={styles.footer}>
        <Button label="Concluir" onPress={goToList} accessibilityHint="Volta para a lista de refeições" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calories: { fontFamily: 'PlusJakartaSans', fontSize: 40, fontWeight: '800', marginTop: spacing.xs },
  caloriesUnit: { fontSize: 16, fontWeight: '700' },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  itemDetail: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', marginTop: 2 },
  itemName: { fontFamily: 'PlusJakartaSans', fontSize: 15.5, fontWeight: '800' },
  itemsTitle: { marginBottom: spacing.sm, marginTop: spacing.lg },
  list: { gap: spacing.sm + spacing.xs },
  macro: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  macroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  mealName: { flexShrink: 1, fontFamily: 'PlusJakartaSans', fontSize: 24, fontWeight: '800' },
  mealTime: { fontFamily: 'PlusJakartaSans', fontSize: 13.5, fontWeight: '600', marginTop: spacing.xs },
  sectionTitle: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 22, fontWeight: '800' },
  titleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  totalMacro: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '800' },
  totalsCard: { marginTop: spacing.lg, padding: spacing.lg },
});
