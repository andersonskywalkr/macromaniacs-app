import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodItem } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing, touchTarget } from '@/theme/tokens';
import { Card } from '@/components/Card';
import { splitHighlight } from '@/utils/foodSuggestions';

// Nome com o trecho digitado em negrito.
export function HighlightedName({ name, query }: { name: string; query: string }) {
  const { tokens } = useTheme();
  return (
    <Text numberOfLines={1} style={[styles.name, { color: tokens.text }]}>
      {splitHighlight(name, query).map((segment, index) => (
        <Text key={index} style={segment.match ? styles.nameMatch : styles.nameRest}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

interface SuggestionsProps {
  text: string;
  suggestions: FoodItem[];
  isLoading: boolean;
  isSettled: boolean;
  onSearchFull: () => void;
  onPick: (food: FoodItem) => void;
}

// Lista logo abaixo do campo: primeiro "Buscar por 'texto'", depois até 8
// sugestões. Erro de rede é silencioso (a busca completa segue disponível).
export function SuggestionsList({
  text,
  suggestions,
  isLoading,
  isSettled,
  onSearchFull,
  onPick,
}: SuggestionsProps) {
  const { tokens } = useTheme();
  const query = text.trim();

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Buscar por ${query}`}
        accessibilityHint="Busca em todas as fontes"
        onPress={onSearchFull}
        style={styles.row}
      >
        <Text numberOfLines={1} style={[styles.searchFull, { color: tokens.primary }]}>
          Buscar por “{query}”
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color={tokens.primary} accessibilityLabel="Carregando sugestões" />
        )}
      </Pressable>

      {suggestions.map((food) => (
        <Pressable
          key={food.id}
          accessibilityRole="button"
          accessibilityLabel={`${food.name}, ${food.nutritionPer100g.calories} calorias por 100 gramas`}
          accessibilityHint="Abre a confirmação do alimento"
          onPress={() => onPick(food)}
          style={[styles.row, styles.suggestion, { borderTopColor: tokens.track }]}
        >
          <View style={styles.textWrap}>
            <HighlightedName name={food.name} query={query} />
            <Text numberOfLines={1} style={[styles.detail, { color: tokens.textSecondary }]}>
              {food.brand ? `${food.brand} · ` : ''}
              {food.nutritionPer100g.calories} kcal por 100 g
            </Text>
          </View>
        </Pressable>
      ))}

      {isSettled && suggestions.length === 0 && (
        <Text style={[styles.empty, { color: tokens.textSecondary }]}>
          Nenhuma sugestão. Toque em Buscar para procurar em todas as fontes.
        </Text>
      )}
    </Card>
  );
}

interface HistoryProps {
  items: string[];
  onPick: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}

// "Buscas recentes": aparece com o campo vazio e em foco.
export function SearchHistoryList({ items, onPick, onRemove, onClear }: HistoryProps) {
  const { tokens } = useTheme();

  return (
    <Card style={styles.card}>
      <View style={styles.historyHeader}>
        <Text style={[styles.historyTitle, { color: tokens.textSecondary }]}>BUSCAS RECENTES</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar histórico"
          hitSlop={8}
          onPress={onClear}
          style={styles.clear}
        >
          <Text style={[styles.clearLabel, { color: tokens.primary }]}>Limpar histórico</Text>
        </Pressable>
      </View>

      {items.map((term) => (
        <View key={term} style={[styles.row, styles.suggestion, { borderTopColor: tokens.track }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Buscar de novo por ${term}`}
            onPress={() => onPick(term)}
            style={styles.historyText}
          >
            <Text numberOfLines={1} style={[styles.name, styles.nameRest, { color: tokens.text }]}>
              {term}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remover ${term} do histórico`}
            hitSlop={4}
            onPress={() => onRemove(term)}
            style={styles.remove}
          >
            <Text style={[styles.removeLabel, { color: tokens.textSecondary }]}>✕</Text>
          </Pressable>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.sm },
  clear: { justifyContent: 'center', minHeight: touchTarget.minSize, paddingHorizontal: spacing.sm },
  clearLabel: { fontFamily: fontFamily(800), fontSize: 13 },
  detail: { fontFamily: fontFamily(600), fontSize: 12, marginTop: 1 },
  empty: { fontFamily: fontFamily(600), fontSize: 13, lineHeight: 19, padding: spacing.md },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm,
  },
  historyText: { flex: 1, justifyContent: 'center', minHeight: touchTarget.minSize },
  historyTitle: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5 },
  name: { fontSize: 15 },
  nameMatch: { fontFamily: fontFamily(800) },
  nameRest: { fontFamily: fontFamily(500) },
  remove: { alignItems: 'center', height: touchTarget.minSize, justifyContent: 'center', width: touchTarget.minSize },
  removeLabel: { fontFamily: fontFamily(700), fontSize: 16 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  searchFull: { flex: 1, fontFamily: fontFamily(800), fontSize: 15 },
  suggestion: { borderTopWidth: 1 },
  textWrap: { flex: 1, minWidth: 0 },
});
