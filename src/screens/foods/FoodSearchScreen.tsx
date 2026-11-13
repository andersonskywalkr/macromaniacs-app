import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MealsStackParamList } from '@/navigation/types';
import type { FoodItem } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, touchTarget } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useFoodSuggestions } from '@/queries/useFoodSuggestions';
import { useFoodsSearch } from '@/queries/useFoodsSearch';
import { isSuggestionQuery } from '@/utils/foodSuggestions';
import { SearchHistoryList, SuggestionsList } from './SearchSuggestionsPanel';
import { formatDecimal, MAX_FOOD_QUERY_LENGTH, MIN_FOOD_QUERY_LENGTH } from '@/utils/nutrition';

import { fontFamily } from '@/theme/fonts';
import { KeyboardAwareScreen, KeyboardAwareScrollView } from '@/components/KeyboardAwareScreen';
type Props = NativeStackScreenProps<MealsStackParamList, 'FoodSearch'>;

function FoodResultRow({ food, onPress }: { food: FoodItem; onPress: () => void }) {
  const { tokens } = useTheme();
  const { calories, protein, carbohydrates, fat } = food.nutritionPer100g;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${food.name}, ${calories} calorias por 100 gramas`}
      accessibilityHint="Abre a confirmação do alimento"
      onPress={onPress}
    >
      <Card>
        <Text style={[styles.foodName, { color: tokens.text }]}>{food.name}</Text>
        <Text style={[styles.foodDetail, { color: tokens.textSecondary }]}>
          {food.brand ? `${food.brand} · ` : ''}
          {calories} kcal por 100 g
        </Text>
        <View style={styles.macroRow}>
          <Text style={[styles.macro, { color: tokens.protein }]}>P {formatDecimal(protein)} g</Text>
          <Text style={[styles.macro, { color: tokens.carbs }]}>C {formatDecimal(carbohydrates)} g</Text>
          <Text style={[styles.macro, { color: tokens.fat }]}>G {formatDecimal(fat)} g</Text>
        </View>
      </Card>
    </Pressable>
  );
}

// Reconstruída a partir de "Busca de Alimento.dc.html". A busca só dispara
// ao tocar em "Buscar" (nunca a cada tecla — limite do Open Food Facts,
// seção 28/108). Os filtros do protótipo (favoritos, meus, marcas) ficam de
// fora: ainda não há dado nem endpoint para eles.
export function FoodSearchScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState('');
  // Cada toque em "Buscar" gera um id novo; 0 = ainda não buscou.
  const [searchId, setSearchId] = useState(0);
  const autoNavigatedFor = useRef(0);

  const search = useFoodsSearch(submitted, searchId > 0);
  const foods = search.data;

  // Sugestões enquanto digita e histórico de busca (só neste aparelho).
  const [focused, setFocused] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const suggestions = useFoodSuggestions(text);
  const history = useSearchHistory();

  // Resultado único vai direto para a confirmação (uma vez por busca).
  useEffect(() => {
    if (searchId === 0 || foods?.length !== 1) return;
    if (autoNavigatedFor.current === searchId) return;
    autoNavigatedFor.current = searchId;
    navigation.navigate('FoodConfirm', { food: foods[0] });
  }, [foods, searchId, navigation]);

  const [queryError, setQueryError] = useState<string | null>(null);
  const canSearch = text.trim().length > 0;

  function handleChangeText(value: string) {
    setText(value);
    setQueryError(null);
    setPanelOpen(true);
  }

  // Busca completa (botão, lupa/teclado, "Buscar por..." e histórico).
  function runFullSearch(term: string) {
    const clean = term.trim();
    // O backend só aceita busca com 2 ou mais letras: avisa antes de chamar a API.
    if (clean.length < MIN_FOOD_QUERY_LENGTH) {
      setQueryError(`Digite pelo menos ${MIN_FOOD_QUERY_LENGTH} letras para buscar.`);
      return;
    }
    setQueryError(null);
    setPanelOpen(false);
    Keyboard.dismiss();
    void history.add(clean);
    setSubmitted(clean);
    setSearchId((id) => id + 1);
  }

  function handleSearch() {
    if (!canSearch) return;
    runFullSearch(text);
  }

  function handlePickSuggestion(food: FoodItem) {
    // Abre a confirmação direto, com o alimento da sugestão (sem nova chamada).
    setPanelOpen(false);
    Keyboard.dismiss();
    void history.add(food.name);
    navigation.navigate('FoodConfirm', { food });
  }

  function handlePickHistory(term: string) {
    setText(term);
    runFullSearch(term);
  }

  function handleClearHistory() {
    Alert.alert('Limpar histórico?', 'As buscas recentes serão apagadas deste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => void history.clear() },
    ]);
  }

  const showHistory = focused && text.trim() === '' && history.items.length > 0;
  const showSuggestions = panelOpen && isSuggestionQuery(text);

  function goToManual() {
    navigation.navigate('FoodManual');
  }

  function renderBody() {
    if (searchId === 0) {
      return (
        <EmptyState
          title="Busque um alimento"
          description="Digite o nome ou a marca e toque em Buscar."
        />
      );
    }

    if (search.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Buscando alimentos" />
        </View>
      );
    }

    if (search.isError) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível buscar"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => search.refetch()} style={styles.fullWidth} />
        </View>
      );
    }

    if (!foods || foods.length === 0) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Nenhum alimento com esse nome"
            description="Cadastre o alimento com os valores do rótulo e ele passa a ficar disponível na sua base."
          />
        </View>
      );
    }

    return (
      <View style={styles.results}>
        <Text style={[styles.resultsTitle, { color: tokens.textSecondary }]}>
          {foods.length === 1 ? '1 resultado' : `${foods.length} resultados`}
        </Text>
        {foods.map((food) => (
          <FoodResultRow
            key={food.id}
            food={food}
            onPress={() => navigation.navigate('FoodConfirm', { food })}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAwareScreen>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={[styles.title, { color: tokens.text }]}>Buscar alimento</Text>
        </View>

        <View style={styles.searchRow}>
          <TextField
            accessibilityLabel="Nome ou marca do alimento"
            placeholder="Nome ou marca do alimento"
            value={text}
            onChangeText={handleChangeText}
            onFocus={() => {
              setFocused(true);
              setPanelOpen(true);
            }}
            onBlur={() => setFocused(false)}
            maxLength={MAX_FOOD_QUERY_LENGTH}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            style={styles.flex}
          />
          <Button label="Buscar" onPress={handleSearch} disabled={!canSearch} />
        </View>

        {queryError && (
          <Text accessibilityRole="alert" style={[styles.queryError, { color: tokens.danger }]}>
            {queryError}
          </Text>
        )}

        <KeyboardAwareScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {showHistory && (
            <SearchHistoryList
              items={history.items}
              onPick={handlePickHistory}
              onRemove={(term) => void history.remove(term)}
              onClear={handleClearHistory}
            />
          )}
          {!showHistory && showSuggestions && (
            <SuggestionsList
              text={text}
              suggestions={suggestions.suggestions}
              isLoading={suggestions.isLoading}
              isSettled={suggestions.isSettled}
              onSearchFull={() => runFullSearch(text)}
              onPick={handlePickSuggestion}
            />
          )}
          {/* Resultado antigo some enquanto as sugestões estão na tela; o estado
              inicial ("Busque um alimento") continua visível. */}
          {!showHistory && !(showSuggestions && searchId > 0) && renderBody()}

          <Button
            label="Cadastrar alimento manualmente"
            variant="secondary"
            onPress={goToManual}
            style={styles.manualButton}
          />
        </KeyboardAwareScrollView>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  flex: { flex: 1 },
  foodDetail: { fontFamily: fontFamily(600), fontSize: 12.5, marginTop: 2 },
  foodName: { fontFamily: fontFamily(800), fontSize: 15.5 },
  fullWidth: { alignSelf: 'stretch' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  macro: { fontFamily: fontFamily(800), fontSize: 13 },
  macroRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  manualButton: { marginTop: spacing.lg },
  queryError: {
    fontFamily: fontFamily(600),
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  results: { gap: spacing.sm + spacing.xs },
  resultsTitle: {
    fontFamily: fontFamily(800),
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.lg,
  },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
});
