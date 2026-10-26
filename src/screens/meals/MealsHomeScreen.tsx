import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealsStackParamList } from '@/navigation/types';
import type { MealLog } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { ChoicePill } from '@/components/ChoicePill';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon } from '@/components/icons';
import { useMealsToday } from '@/queries/useMealsToday';
import { useMealDraftStore } from '@/store/mealDraftStore';
import {
  filterMealsByType,
  formatTime,
  itemsCountLabel,
  MEAL_FILTER_OPTIONS,
  mealTotals,
  mealTitle,
  mealTypeLabel,
  sortMealsNewestFirst,
  type MealTypeFilter,
} from '@/utils/meals';
import { formatDecimal } from '@/utils/nutrition';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealsHome'>;

function MealRow({ meal, onPress }: { meal: MealLog; onPress: () => void }) {
  const { tokens } = useTheme();
  const label = mealTitle(meal);
  const typeLabel = meal.mealType ? mealTypeLabel(meal.mealType) : null;
  // Com nome do prato, o tipo aparece como Badge ao lado; sem nome, o título
  // já é o tipo.
  const showTypeBadge = Boolean(meal.name && typeLabel);
  const totals = mealTotals(meal);
  const time = formatTime(meal.consumedAt);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${showTypeBadge ? `, ${typeLabel}` : ''}, ${time}, ${totals.calories} calorias, ${itemsCountLabel(meal.items.length)}`}
      accessibilityHint="Abre o detalhe da refeição"
      onPress={onPress}
    >
      <Card>
        <View style={styles.rowHeader}>
          <View style={styles.titleWrap}>
            <Text numberOfLines={1} style={[styles.mealName, { color: tokens.text }]}>
              {label}
            </Text>
            {showTypeBadge && <Badge label={typeLabel!} />}
          </View>
          <Text style={[styles.mealTime, { color: tokens.textSecondary }]}>{time}</Text>
        </View>
        <Text style={[styles.mealDetail, { color: tokens.textSecondary }]}>
          {itemsCountLabel(meal.items.length)}
        </Text>
        <View style={styles.macroRow}>
          <Text style={[styles.mealCalories, { color: tokens.text }]}>{totals.calories} kcal</Text>
          <Text style={[styles.macro, { color: tokens.protein }]}>P {formatDecimal(totals.protein)} g</Text>
          <Text style={[styles.macro, { color: tokens.carbs }]}>
            C {formatDecimal(totals.carbohydrates)} g
          </Text>
          <Text style={[styles.macro, { color: tokens.fat }]}>G {formatDecimal(totals.fat)} g</Text>
        </View>
      </Card>
    </Pressable>
  );
}

// Lista das refeições de hoje (item 6). Do protótipo ficaram de fora a busca
// e os favoritos de "pratos salvos" e o "Repetir" — não há dado nem endpoint
// para pratos salvos.
export function MealsHomeScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const meals = useMealsToday();
  const draftCount = useMealDraftStore((s) => s.items.length);
  const [filter, setFilter] = useState<MealTypeFilter>('ALL');

  function startMeal() {
    // Com um prato já em andamento, continua nele em vez de abrir outro.
    navigation.navigate(draftCount > 0 ? 'MealBuilder' : 'FoodSearch');
  }

  function renderBody() {
    if (meals.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando refeições" />
        </View>
      );
    }

    if (meals.isError) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar as refeições"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => meals.refetch()} style={styles.fullWidth} />
        </View>
      );
    }

    const all = meals.data ?? [];
    const visible = sortMealsNewestFirst(filterMealsByType(all, filter));

    if (visible.length === 0) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title={all.length === 0 ? 'Nenhuma refeição hoje' : 'Nenhuma refeição desse tipo hoje'}
            description="Registre o que você comeu para acompanhar suas calorias."
          />
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {visible.map((meal) => (
          <MealRow
            key={meal.id}
            meal={meal}
            onPress={() => navigation.navigate('MealReview', { mealId: meal.id })}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <Text style={[styles.title, { color: tokens.text }]}>Refeições</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
        accessibilityRole="radiogroup"
      >
        {MEAL_FILTER_OPTIONS.map((option) => (
          <ChoicePill
            key={option.value}
            variant="inverted"
            label={option.label}
            selected={filter === option.value}
            onPress={() => setFilter(option.value)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>{renderBody()}</ScrollView>

      <View style={styles.footer}>
        <Button
          label="Adicionar refeição"
          variant="dark"
          icon={<PlusIcon size={14} color={tokens.background} />}
          onPress={startMeal}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  filterRow: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  filterScroll: { flexGrow: 0 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
  list: { gap: spacing.sm + spacing.xs },
  macro: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  macroRow: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  mealCalories: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '800' },
  mealDetail: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  mealName: { flexShrink: 1, fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800' },
  mealTime: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700' },
  rowHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between' },
  title: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 26,
    fontWeight: '800',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  titleWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm, minWidth: 0 },
});
