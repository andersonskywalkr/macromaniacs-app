import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { parseDecimal, validateAmount } from '@/utils/nutrition';
import { TextField } from '@/components/TextField';
import { useUpdateMeal } from '@/queries/useUpdateMeal';
import { useDeleteMeal } from '@/queries/useDeleteMeal';

import { fontFamily } from '@/theme/fonts';
type Props = NativeStackScreenProps<MealsStackParamList, 'MealReview'>;

// Detalhe da refeição (item 11), logo após salvar ou aberto pela lista. Lê
// da lista de hoje (useMealsToday), que já recebe a refeição nova ao salvar.
export function MealReviewScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const meals = useMealsToday();
  const meal = meals.data?.find((m) => m.id === route.params.mealId);
  const updateMeal = useUpdateMeal();
  const deleteMeal = useDeleteMeal();
  const [editing, setEditing] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  function goToList() {
    navigation.reset({ index: 0, routes: [{ name: 'MealsHome' }] });
  }

  function startEditing() {
    if (!meal) return;
    setAmounts(Object.fromEntries(meal.items.map((item) => [item.id, String(item.amountGrams)])));
    setActionError(null);
    setEditing(true);
  }

  async function saveEdits() {
    if (!meal) return;
    const invalid = meal.items.some(
      (item) => !item.foodId || validateAmount(amounts[item.id] ?? String(item.amountGrams)),
    );
    if (invalid) {
      setActionError('Revise as quantidades. Alimentos removidos do catálogo não podem ser editados.');
      return;
    }
    try {
      await updateMeal.mutateAsync({
        mealId: meal.id,
        items: meal.items.map((item) => ({
          foodId: item.foodId,
          amountGrams: parseDecimal(amounts[item.id] ?? String(item.amountGrams))!,
        })),
      });
      setEditing(false);
      setActionError(null);
    } catch {
      setActionError('Não foi possível atualizar a refeição. Tente novamente.');
    }
  }

  function confirmDelete() {
    if (!meal) return;
    Alert.alert('Excluir refeição?', 'Os totais, o progresso e os pontos serão recalculados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeal.mutateAsync(meal.id);
            goToList();
          } catch {
            setActionError('Não foi possível excluir a refeição. Tente novamente.');
          }
        },
      },
    ]);
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
              {editing && (
                <View style={styles.editAmount}>
                  <Text style={[styles.itemDetail, { color: tokens.textSecondary }]}>Quantidade (g)</Text>
                  <TextField
                    accessibilityLabel={`Nova quantidade de ${item.foodName}`}
                    value={amounts[item.id] ?? String(item.amountGrams)}
                    onChangeText={(value) => setAmounts((current) => ({ ...current, [item.id]: value }))}
                    keyboardType="decimal-pad"
                    maxLength={7}
                    style={styles.amountField}
                  />
                </View>
              )}
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
        {actionError && (
          <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
            {actionError}
          </Text>
        )}
        {meal && editing ? (
          <View style={styles.footerActions}>
            <Button
              label="Cancelar edição"
              variant="secondary"
              onPress={() => setEditing(false)}
              disabled={updateMeal.isPending}
              style={styles.footerButton}
            />
            <Button
              label="Salvar alterações"
              onPress={saveEdits}
              loading={updateMeal.isPending}
              style={styles.footerButton}
            />
          </View>
        ) : (
          <>
            {meal && (
              <View style={styles.footerActions}>
                <Button label="Editar quantidades" variant="secondary" onPress={startEditing} style={styles.footerButton} />
                <Button label="Excluir refeição" variant="secondary" onPress={confirmDelete} loading={deleteMeal.isPending} style={styles.footerButton} />
              </View>
            )}
            <Button label="Concluir" onPress={goToList} accessibilityHint="Volta para a lista de refeições" />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  amountField: { flex: 1 },
  calories: { fontFamily: fontFamily(800), fontSize: 40, marginTop: spacing.xs },
  caloriesUnit: { fontFamily: fontFamily(700), fontSize: 16 },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  editAmount: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  error: { fontFamily: fontFamily(600), fontSize: 13, marginBottom: spacing.sm, textAlign: 'center' },
  footer: { gap: spacing.sm, padding: spacing.lg, paddingTop: spacing.sm },
  footerActions: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
  fullWidth: { alignSelf: 'stretch' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  itemDetail: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 2 },
  itemName: { fontFamily: fontFamily(800), fontSize: 15.5 },
  itemsTitle: { marginBottom: spacing.sm, marginTop: spacing.lg },
  list: { gap: spacing.sm + spacing.xs },
  macro: { fontFamily: fontFamily(800), fontSize: 13 },
  macroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  mealName: { flexShrink: 1, fontFamily: fontFamily(800), fontSize: 24 },
  mealTime: { fontFamily: fontFamily(600), fontSize: 13.5, marginTop: spacing.xs },
  sectionTitle: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5 },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
  titleRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  totalMacro: { fontFamily: fontFamily(800), fontSize: 15 },
  totalsCard: { marginTop: spacing.lg, padding: spacing.lg },
});
