import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealsStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { useMealDraftStore } from '@/store/mealDraftStore';
import {
  DEFAULT_AMOUNT_GRAMS,
  formatDecimal,
  parseDecimal,
  scaleNutrition,
  validateAmount,
} from '@/utils/nutrition';

import { fontFamily } from '@/theme/fonts';
import { KeyboardAwareFooter, KeyboardAwareScreen, KeyboardAwareScrollView } from '@/components/KeyboardAwareScreen';
type Props = NativeStackScreenProps<MealsStackParamList, 'FoodConfirm'>;

// UC-07 — confirmação do alimento escolhido: quantidade em gramas com
// recálculo ao vivo dos valores. Salva no rascunho da refeição
// (mealDraftStore). Se o alimento já está no rascunho, pergunta se soma à
// quantidade atual ou substitui (o store identifica o item pelo id).
export function FoodConfirmScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { food } = route.params;
  const draftItems = useMealDraftStore((s) => s.items);
  const addItem = useMealDraftStore((s) => s.addItem);
  const updateAmount = useMealDraftStore((s) => s.updateAmount);

  const [amountText, setAmountText] = useState(String(DEFAULT_AMOUNT_GRAMS));

  const error = validateAmount(amountText);
  const amount = error ? null : parseDecimal(amountText);
  const scaled = amount === null ? null : scaleNutrition(food.nutritionPer100g, amount);

  const [addError, setAddError] = useState<string | null>(null);

  function goToHub() {
    // Vindo do hub (Adicionar alimento), volta pra ele em vez de abrir outro.
    // Na primeira vez, o hub vira a raiz da pilha (sem Busca/Confirmação
    // por baixo).
    const hubIsOpen = navigation.getState().routes.some((r) => r.name === 'MealBuilder');
    if (hubIsOpen) {
      navigation.popTo('MealBuilder');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MealBuilder' }] });
    }
  }

  function commit(finalAmount: number, existing: boolean) {
    if (existing) {
      updateAmount(food.id, finalAmount);
    } else {
      addItem({ food, amountGrams: finalAmount });
    }
    goToHub();
  }

  function handleAdd() {
    if (amount === null) return;
    setAddError(null);

    const existing = draftItems.find((item) => item.food.id === food.id);
    if (!existing) {
      commit(amount, false);
      return;
    }

    // Mesmo alimento de novo: o usuário escolhe somar ou substituir.
    const summed = existing.amountGrams + amount;
    Alert.alert(
      'Alimento já está no prato',
      `${food.name} já tem ${formatDecimal(existing.amountGrams)} g. O que fazer com os ${formatDecimal(amount)} g?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Substituir', onPress: () => commit(amount, true) },
        {
          text: 'Somar à quantidade atual',
          onPress: () => {
            const sumError = validateAmount(String(summed));
            if (sumError) {
              setAddError(`A soma (${formatDecimal(summed)} g) passa do limite. ${sumError}`);
              return;
            }
            commit(summed, true);
          },
        },
      ],
    );
  }

  const macros = [
    { label: 'Proteína', value: scaled?.protein, color: tokens.protein },
    { label: 'Carboidrato', value: scaled?.carbohydrates, color: tokens.carbs },
    { label: 'Gordura', value: scaled?.fat, color: tokens.fat },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAwareScreen>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: tokens.text }]}>Confirmar alimento</Text>
        </View>

        <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.foodName, { color: tokens.text }]}>{food.name}</Text>
          <Text style={[styles.foodDetail, { color: tokens.textSecondary }]}>
            {food.brand ? `${food.brand} · ` : ''}
            {food.nutritionPer100g.calories} kcal por 100 g
          </Text>

          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>Quantidade (g)</Text>
          <TextField
            accessibilityLabel="Quantidade em gramas"
            placeholder="Quantidade em gramas"
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            maxLength={7}
            selectTextOnFocus
          />
          {(error ?? addError) && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error ?? addError}
            </Text>
          )}

          <Card style={styles.totalsCard}>
            <Text style={[styles.totalsTitle, { color: tokens.textSecondary }]}>
              {amount === null ? 'VALORES' : `VALORES PARA ${formatDecimal(amount)} G`}
            </Text>
            <Text
              accessibilityLabel={scaled ? `${scaled.calories} calorias` : 'Calorias indisponíveis'}
              style={[styles.calories, { color: tokens.text }]}
            >
              {scaled ? scaled.calories : '—'}
              <Text style={[styles.caloriesUnit, { color: tokens.textSecondary }]}> kcal</Text>
            </Text>
            <View style={styles.macroRow}>
              {macros.map((macro) => (
                <View key={macro.label} style={styles.macroItem}>
                  <Text style={[styles.macroValue, { color: macro.color }]}>
                    {macro.value === undefined ? '—' : `${formatDecimal(macro.value)} g`}
                  </Text>
                  <Text style={[styles.macroLabel, { color: tokens.textSecondary }]}>{macro.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </KeyboardAwareScrollView>

        <KeyboardAwareFooter style={styles.footer}>
          <Button
            label="Adicionar à refeição"
            onPress={handleAdd}
            disabled={error !== null}
            accessibilityHint="Salva o alimento no rascunho da refeição"
          />
        </KeyboardAwareFooter>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  calories: { fontFamily: fontFamily(800), fontSize: 40, marginTop: spacing.xs },
  caloriesUnit: { fontFamily: fontFamily(700), fontSize: 16 },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  error: { fontFamily: fontFamily(600), fontSize: 13, marginTop: spacing.sm },
  fieldLabel: {
    fontFamily: fontFamily(800),
    fontSize: 12.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  foodDetail: { fontFamily: fontFamily(600), fontSize: 13.5, marginTop: spacing.xs },
  foodName: { fontFamily: fontFamily(800), fontSize: 24, lineHeight: 30 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  macroItem: { flex: 1 },
  macroLabel: { fontFamily: fontFamily(600), fontSize: 12.5, marginTop: 2 },
  macroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  macroValue: { fontFamily: fontFamily(800), fontSize: 18 },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
  totalsCard: { marginTop: spacing.lg, padding: spacing.lg },
  totalsTitle: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5 },
});
