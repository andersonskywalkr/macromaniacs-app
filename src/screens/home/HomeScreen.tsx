import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { AppTabsParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing, radius } from '@/theme/tokens';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { ProgressRing } from '@/components/ProgressRing';
import { MacroBar } from '@/components/MacroBar';
import { InlineRetry } from '@/components/InlineRetry';
import { BellIcon, PlusIcon, ChevronRightIcon, TrendingUpIcon, FireIcon, MedalIcon } from '@/components/icons';
import { useGamificationStats } from '@/queries/useGamificationStats';
import { useProgressToday } from '@/queries/useProgressToday';
import { useMyGroups } from '@/queries/useMyGroups';
import { useGroupRanking } from '@/queries/useGroupRanking';
import { formatFriendlyDate } from '@/utils/formatDate';
import { resolveMacroGoals, summarizeCalories } from '@/utils/dailyProgress';
import { useAuthStore } from '@/store/authStore';

type Props = BottomTabScreenProps<AppTabsParamList, 'HomeTab'>;

// Reconstruída a partir de "Home Minimalista.dc.html" do protótipo.
// Sem endpoint agregador em P0 (seção 127.3) — os dados vêm de queries
// paralelas independentes (progresso, gamificação, perfil, grupo/ranking).
// Cada consulta falha sozinha: o que carregou continua na tela e só a parte
// com erro mostra "Tentar de novo".
export function HomeScreen({ navigation }: Props) {
  const { tokens } = useTheme();

  const gamification = useGamificationStats();
  const progress = useProgressToday();
  const currentUser = useAuthStore((state) => state.user);
  const groups = useMyGroups();
  const primaryGroup = groups.data?.[0];
  const ranking = useGroupRanking(primaryGroup?.id);

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerFill}>
          <ActivityIndicator color={tokens.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const todayLabel = formatFriendlyDate(new Date());
  const rankingEntries = (ranking.data ?? []).slice(0, 3);

  // Meta calórica que o app já usa (derivada do TDEE e do objetivo); se o
  // perfil não trouxer, cai na meta do progresso do dia.
  const calorieGoal =
    currentUser.nutrition?.calorieTargetKcalPerDay ?? progress.data?.calories.goal ?? null;

  function renderCaloriesCard() {
    if (progress.isLoading) {
      return <ActivityIndicator color={tokens.primary} accessibilityLabel="Carregando seu consumo" />;
    }

    if (progress.isError || !progress.data || calorieGoal === null) {
      return (
        <InlineRetry
          message="Não foi possível carregar seu consumo de hoje."
          onRetry={() => progress.refetch()}
        />
      );
    }

    const data = progress.data;
    const summary = summarizeCalories(calorieGoal, data.calories.consumed);
    const macroGoals = resolveMacroGoals(calorieGoal, {
      protein: data.protein.goal,
      carbohydrates: data.carbohydrates.goal,
      fat: data.fat.goal,
    });

    return (
      <>
        <View style={styles.summaryRow}>
          <View style={[styles.summarySide, styles.summarySideLeft]}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[styles.summarySideValue, { color: tokens.text }]}
            >
              {Math.round(summary.consumed)}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={[styles.summarySideLabel, { color: tokens.textSecondary }]}
            >
              consumidas
            </Text>
          </View>

          <View style={styles.ringWrap}>
            <ProgressRing
              progress={summary.ringProgress}
              size={152}
              strokeWidth={10}
              color={tokens.ring}
              trackColor={tokens.track}
              accessibilityLabel={`Meta energética diária: ${summary.percent}% consumido`}
            />
            <View style={styles.ringCenter} pointerEvents="none">
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={[styles.ringValue, { color: tokens.text }]}
              >
                {Math.round(summary.remaining)}
              </Text>
              <Text style={[styles.ringLabel, { color: tokens.textSecondary }]}>kcal restantes</Text>
            </View>
          </View>

          <View style={[styles.summarySide, styles.summarySideRight]}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={[styles.summarySideValue, { color: tokens.text }]}
            >
              {Math.round(summary.goal)}
            </Text>
            <Text numberOfLines={1} style={[styles.summarySideLabel, { color: tokens.textSecondary }]}>
              meta
            </Text>
          </View>
        </View>

        {summary.over > 0 && (
          <Text accessibilityRole="alert" style={[styles.overText, { color: tokens.danger }]}>
            {Math.round(summary.over)} kcal acima da meta
          </Text>
        )}

        <View style={styles.macros}>
          <MacroBar
            label="Carboidratos"
            consumed={data.carbohydrates.consumed}
            goal={macroGoals.carbohydrates}
            color={tokens.carbs}
          />
          <MacroBar
            label="Proteínas"
            consumed={data.protein.consumed}
            goal={macroGoals.protein}
            color={tokens.protein}
          />
          <MacroBar label="Gorduras" consumed={data.fat.consumed} goal={macroGoals.fat} color={tokens.fat} />
        </View>
      </>
    );
  }

  function renderRankingCard() {
    if (groups.isError) {
      return (
        <Card style={styles.rankingCard}>
          <InlineRetry
            message="Não foi possível carregar o ranking do grupo."
            onRetry={() => groups.refetch()}
          />
        </Card>
      );
    }

    if (!primaryGroup) return null;

    return (
      <Card style={styles.rankingCard}>
        <View style={styles.rankingHeader}>
          <Text style={[styles.rankingTitle, { color: tokens.text }]}>Ranking do grupo</Text>
          <Text style={[styles.rankingGroupName, { color: tokens.primary }]}>{primaryGroup.name}</Text>
        </View>

        {ranking.isLoading ? (
          <ActivityIndicator color={tokens.primary} />
        ) : ranking.isError ? (
          <InlineRetry message="Não foi possível carregar o ranking." onRetry={() => ranking.refetch()} />
        ) : (
          <View style={styles.rankingList}>
            {rankingEntries.map((entry) => {
              const isYou = entry.userId === currentUser!.id;
              const pointsColor = isYou ? tokens.primary : entry.position === 1 ? tokens.gold : tokens.textSecondary;
              return (
                <View key={entry.userId} style={styles.rankingRow}>
                  <View style={styles.rankingPosition}>
                    {entry.position <= 3 ? (
                      <MedalIcon rank={entry.position as 1 | 2 | 3} size={18} />
                    ) : (
                      <Text style={[styles.rankingPositionText, { color: tokens.textSecondary }]}>
                        {entry.position}
                      </Text>
                    )}
                  </View>
                  <Avatar uri={null} displayName={entry.displayName} size={30} />
                  <Text numberOfLines={1} style={[styles.rankingName, { color: tokens.text }]}>
                    {isYou ? 'Você' : entry.displayName}
                  </Text>
                  <Text style={[styles.rankingPoints, { color: pointsColor }]}>{entry.points} pts</Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={[styles.profilePill, { backgroundColor: tokens.card }]}>
            <Avatar uri={null} displayName={currentUser.displayName ?? currentUser.username} size={44} />
            <View style={styles.profileTextWrap}>
              <Text numberOfLines={1} style={[styles.greeting, { color: tokens.text }]}>
                Olá, {currentUser.displayName ?? currentUser.username}
              </Text>
              <Text numberOfLines={1} style={[styles.dateText, { color: tokens.textSecondary }]}>
                {todayLabel}
              </Text>
            </View>
          </View>

          {gamification.data && (
            <View
              style={[styles.streakPill, { backgroundColor: tokens.card }]}
              accessible
              accessibilityLabel={`Sequência de ${gamification.data.currentStreak} dias`}
            >
              <FireIcon size={16} />
              <Text style={[styles.streakText, { color: tokens.text }]}>{gamification.data.currentStreak}</Text>
            </View>
          )}

          {/* TODO: abrir tela de notificações quando essa rota existir (sem backend/endpoint ainda) */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificações"
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: tokens.card }]}
          >
            <BellIcon size={20} color={tokens.textSecondary} />
          </Pressable>
        </View>

        {gamification.isError && (
          <InlineRetry
            message="Não foi possível carregar sua sequência."
            onRetry={() => gamification.refetch()}
          />
        )}

        <Card style={styles.summaryCard}>{renderCaloriesCard()}</Card>

        <Button
          label="Adicionar refeição"
          variant="dark"
          icon={<PlusIcon size={14} color={tokens.background} />}
          accessibilityHint="Abre a busca de alimento para registrar o que você comeu"
          onPress={() => navigation.navigate('MealsTab', { screen: 'FoodSearch' })}
        />

        <Pressable
          style={styles.performanceRow}
          onPress={() => navigation.navigate('ProfileTab', { screen: 'History' })}
          accessibilityRole="button"
          accessibilityLabel="Desempenho"
          accessibilityHint="Abre o histórico de desempenho"
        >
          <View style={[styles.performanceIcon, { backgroundColor: tokens.card }]}>
            <TrendingUpIcon size={20} color={tokens.primary} />
          </View>
          <View style={styles.performanceTextWrap}>
            <Text style={[styles.performanceTitle, { color: tokens.text }]}>Desempenho</Text>
            <Text style={[styles.performanceSubtitle, { color: tokens.textSecondary }]}>
              Ver seu histórico de metas batidas
            </Text>
          </View>
          <ChevronRightIcon size={8} color={tokens.textSecondary} />
        </Pressable>

        {renderRankingCard()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerFill: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { flex: 1 },
  dateText: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  greeting: { fontFamily: 'PlusJakartaSans', fontSize: 19, fontWeight: '800' },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  macros: { gap: spacing.md, marginTop: spacing.lg },
  overText: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    fontWeight: '800',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  performanceIcon: {
    alignItems: 'center',
    borderRadius: radius.card / 2 - 2,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  performanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 44,
  },
  performanceSubtitle: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  performanceTextWrap: { flex: 1, minWidth: 0 },
  performanceTitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '700' },
  profilePill: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minWidth: 0,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    paddingVertical: spacing.xs,
  },

  profileTextWrap: { flex: 1, minWidth: 0 },
  rankingCard: { padding: spacing.lg },
  rankingGroupName: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '700' },
  rankingHeader: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  rankingList: { gap: spacing.sm + spacing.xs },
  rankingName: { flex: 1, fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '700', minWidth: 0 },
  rankingPoints: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '800' },
  rankingPosition: { alignItems: 'center', justifyContent: 'center', width: 20 },

  rankingPositionText: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '700' },
  rankingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm + spacing.xs },
  rankingTitle: { fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '800' },
  ringCenter: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ringLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12.5, fontWeight: '600', marginTop: 4 },
  ringValue: { fontFamily: 'PlusJakartaSans', fontSize: 40, fontWeight: '800', lineHeight: 44 },
  ringWrap: {
    alignItems: 'center',
    height: 152,
    justifyContent: 'center',
    width: 152,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg + spacing.xs,
  },
  streakPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 44,
    paddingHorizontal: spacing.sm,
  },
  streakText: { fontFamily: 'PlusJakartaSans', fontSize: 14, fontWeight: '800' },

  // Padding horizontal menor: as colunas laterais ficam mais largas e o
  // texto "consumidas" cabe inteiro.
  summaryCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  // flex:1 (em vez de largura fixa) garante que o anel fique sempre
  // centralizado, dividindo igualmente o espaço que sobra em qualquer
  // largura de tela — o protótipo original tinha 84px fixos, mas isso
  // só cabia na artboard de 440px dele, estourando em celulares reais.
  summarySide: { alignItems: 'center', flex: 1 },
  summarySideLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', marginTop: 2 },
  summarySideLeft: { marginLeft: -spacing.sm },
  summarySideRight: { marginRight: -spacing.sm },
  summarySideValue: { fontFamily: 'PlusJakartaSans', fontSize: 19, fontWeight: '800' },
});
