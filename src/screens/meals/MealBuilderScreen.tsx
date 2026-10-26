import React, { useCallback, useState } from 'react';
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealsStackParamList } from '@/navigation/types';
import { ApiError } from '@/api/ApiError';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChoicePill } from '@/components/ChoicePill';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { useCreateMeal } from '@/queries/useCreateMeal';
import { useMealDraftStore, type MealDraftItem } from '@/store/mealDraftStore';
import {
  canSaveMeal,
  draftTotals,
  itemsCountLabel,
  MEAL_TYPE_OPTIONS,
  suggestMealType,
} from '@/utils/meals';
import { formatDecimal, parseDecimal, scaleNutrition, validateAmount } from '@/utils/nutrition';

type Props = NativeStackScreenProps<MealsStackParamList, 'MealBuilder'>;

const MEAL_NAME_MAX_LENGTH = 60;

function DraftItemCard({
  item,
  text,
  onChangeText,
  onRemove,
}: {
  item: MealDraftItem;
  text: string;
  onChangeText: (value: string) => void;
  onRemove: () => void;
}) {
  const { tokens } = useTheme();
  const error = validateAmount(text);
  const scaled = scaleNutrition(item.food.nutritionPer100g, item.amountGrams);

  return (
    <Card>
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleWrap}>
          <Text style={[styles.itemName, { color: tokens.text }]}>{item.food.name}</Text>
          <Text style={[styles.itemDetail, { color: tokens.textSecondary }]}>
            {scaled.calories} kcal
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remover ${item.food.name} da refeição`}
          hitSlop={8}
          onPress={onRemove}
          style={styles.removeButton}
        >
          <Text style={[styles.removeLabel, { color: tokens.danger }]}>Remover</Text>
        </Pressable>
      </View>

      <View style={styles.macroRow}>
        <Text style={[styles.macro, { color: tokens.protein }]}>P {formatDecimal(scaled.protein)} g</Text>
        <Text style={[styles.macro, { color: tokens.carbs }]}>
          C {formatDecimal(scaled.carbohydrates)} g
        </Text>
        <Text style={[styles.macro, { color: tokens.fat }]}>G {formatDecimal(scaled.fat)} g</Text>
      </View>

      <View style={styles.amountRow}>
        <Text style={[styles.amountLabel, { color: tokens.textSecondary }]}>Quantidade (g)</Text>
        <TextField
          accessibilityLabel={`Quantidade de ${item.food.name} em gramas`}
          value={text}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          maxLength={7}
          style={styles.amountField}
        />
      </View>
      {error && (
        <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
          {error}
        </Text>
      )}
    </Card>
  );
}

// Hub da refeição (item 7). O rascunho vive no mealDraftStore; aqui o
// usuário revisa, ajusta quantidades, escolhe o tipo e salva.
export function MealBuilderScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const items = useMealDraftStore((s) => s.items);
  const updateAmount = useMealDraftStore((s) => s.updateAmount);
  const removeItem = useMealDraftStore((s) => s.removeItem);
  const clearDraft = useMealDraftStore((s) => s.clear);
  const createMeal = useCreateMeal();

  const [mealType, setMealType] = useState(() => suggestMealType(new Date()));
  // Nome do prato (opcional), separado do tipo.
  const [mealName, setMealName] = useState('');
  // Texto digitado por alimento (só enquanto difere do valor salvo).
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Texto válido que difere da quantidade do rascunho = a quantidade mudou
  // por fora (alimento adicionado de novo): vale a do rascunho.
  function textFor(item: MealDraftItem): string {
    const typed = texts[item.food.id];
    if (typed === undefined) return String(item.amountGrams);
    if (validateAmount(typed) === null && parseDecimal(typed) !== item.amountGrams) {
      return String(item.amountGrams);
    }
    return typed;
  }

  function handleAmountChange(item: MealDraftItem, value: string) {
    setTexts((prev) => ({ ...prev, [item.food.id]: value }));
    if (validateAmount(value) === null) {
      updateAmount(item.food.id, parseDecimal(value)!);
    }
  }

  const hasInvalidAmount = items.some((item) => validateAmount(textFor(item)) !== null);
  const totals = draftTotals(items);
  const canSave = canSaveMeal(items, hasInvalidAmount, createMeal.isPending);

  const goToList = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'MealsHome' }] });
  }, [navigation]);

  const requestLeave = useCallback(() => {
    if (items.length === 0) {
      goToList();
      return;
    }
    Alert.alert('Descartar refeição?', 'Os alimentos do prato serão perdidos.', [
      { text: 'Continuar editando', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => {
          clearDraft();
          goToList();
        },
      },
    ]);
  }, [items.length, clearDraft, goToList]);

  // Botão voltar do Android também pede confirmação.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        requestLeave();
        return true;
      });
      return () => subscription.remove();
    }, [requestLeave]),
  );

  async function handleSave() {
    if (!canSave) return;
    setError(null);

    try {
      const meal = await createMeal.mutateAsync({
        mealType,
        name: mealName.trim() || undefined,
        consumedAt: new Date().toISOString(),
        items: items.map((item) => ({ foodId: item.food.id, amountGrams: item.amountGrams })),
      });
      clearDraft();
      navigation.reset({
        index: 1,
        routes: [{ name: 'MealsHome' }, { name: 'MealReview', params: { mealId: meal.id } }],
      });
    } catch (err) {
      if (err instanceof ApiError && err.isNetworkError) {
        // useCreateMeal já guardou a refeição na fila offline; ela é enviada
        // quando a conexão voltar.
        clearDraft();
        Alert.alert(
          'Sem conexão',
          'Sua refeição foi guardada no celular e será enviada quando a internet voltar.',
        );
        goToList();
        return;
      }
      setError('Não foi possível salvar a refeição. Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.header}>
          <BackButton onPress={requestLeave} />
          <Text style={[styles.title, { color: tokens.text }]}>Montar refeição</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>Nome da refeição (opcional)</Text>
          <TextField
            accessibilityLabel="Nome da refeição, opcional"
            placeholder="Ex.: Arroz, feijão e frango"
            value={mealName}
            onChangeText={setMealName}
            maxLength={MEAL_NAME_MAX_LENGTH}
          />

          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>Tipo da refeição</Text>
          <View accessibilityRole="radiogroup" style={styles.typeRow}>
            {MEAL_TYPE_OPTIONS.map((option) => (
              <ChoicePill
                key={option.value}
                variant="inverted"
                label={option.label}
                selected={mealType === option.value}
                onPress={() => setMealType(option.value)}
              />
            ))}
          </View>

          <Card style={styles.totalsCard}>
            <Text style={[styles.totalsTitle, { color: tokens.textSecondary }]}>TOTAL DA REFEIÇÃO</Text>
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
            <Text style={[styles.itemDetail, { color: tokens.textSecondary }]}>
              {formatDecimal(totals.grams)} g no prato
            </Text>
          </Card>

          <View style={styles.listHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>ITENS DO PRATO</Text>
            <Text style={[styles.sectionTitle, { color: tokens.textSecondary }]}>
              {itemsCountLabel(items.length)}
            </Text>
          </View>

          <Button
            label="Adicionar alimento"
            variant="secondary"
            onPress={() => navigation.navigate('FoodSearch')}
            style={styles.addButtonTop}
          />

          {items.length === 0 ? (
            <EmptyState
              title="Nenhum alimento no prato"
              description="Adicione alimentos para montar a refeição."
            />
          ) : (
            <View style={styles.list}>
              {items.map((item) => (
                <DraftItemCard
                  key={item.food.id}
                  item={item}
                  text={textFor(item)}
                  onChangeText={(value) => handleAmountChange(item, value)}
                  onRemove={() => removeItem(item.food.id)}
                />
              ))}
            </View>
          )}

        </ScrollView>

        <View style={styles.footer}>
          {error && (
            <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>
              {error}
            </Text>
          )}
          <Button
            label="Salvar refeição"
            onPress={handleSave}
            disabled={!canSave}
            loading={createMeal.isPending}
            accessibilityHint="Registra a refeição e abre o detalhe"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addButtonTop: { marginBottom: spacing.md },
  amountField: { flex: 1 },
  amountLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '800' },
  amountRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  calories: { fontFamily: 'PlusJakartaSans', fontSize: 40, fontWeight: '800', marginTop: spacing.xs },
  caloriesUnit: { fontSize: 16, fontWeight: '700' },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  error: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  fieldLabel: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  flex: { flex: 1 },
  footer: { padding: spacing.lg, paddingTop: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  itemDetail: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  itemHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  itemName: { fontFamily: 'PlusJakartaSans', fontSize: 15.5, fontWeight: '800' },
  itemTitleWrap: { flex: 1, minWidth: 0 },
  list: { gap: spacing.sm + spacing.xs },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  macro: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  macroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  removeButton: { justifyContent: 'center', minHeight: touchTarget.minSize, paddingHorizontal: spacing.sm },
  removeLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontFamily: 'PlusJakartaSans', fontSize: 22, fontWeight: '800' },
  totalMacro: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '800' },
  totalsCard: { marginTop: spacing.lg, padding: spacing.lg },
  totalsTitle: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '800', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
