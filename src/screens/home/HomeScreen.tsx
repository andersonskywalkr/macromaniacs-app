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
import { EmptyState } from '@/components/EmptyState';
import { BellIcon, ThemeToggleIcon, PlusIcon, ChevronRightIcon, TrendingUpIcon, FireIcon, MedalIcon } from '@/components/icons';
import { useProgressToday } from '@/queries/useProgressToday';
import { useGamificationStats } from '@/queries/useGamificationStats';
import { useMyProfile } from '@/queries/useMyProfile';
import { useMyGroups } from '@/queries/useMyGroups';
import { useGroupRanking } from '@/queries/useGroupRanking';
import { formatFriendlyDate } from '@/utils/formatDate';

type Props = BottomTabScreenProps<AppTabsParamList, 'HomeTab'>;

// Reconstruída a partir de "Home Minimalista.dc.html" do protótipo.
// Sem endpoint agregador em P0 (seção 127.3) — os dados vêm de queries
// paralelas independentes (progresso, gamificação, perfil, grupo/ranking).
export function HomeScreen({ navigation }: Props) {
  const { tokens, mode, setMode } = useTheme();

  const progress = useProgressToday();
  const gamification = useGamificationStats();
  const profile = useMyProfile();
  const groups = useMyGroups();
  const primaryGroup = groups.data?.[0];
  const ranking = useGroupRanking(primaryGroup?.id);

  const isLoading = progress.isLoading || gamification.isLoading || profile.isLoading;
  const hasError = progress.isError || gamification.isError || profile.isError;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerFill}>
          <ActivityIndicator color={tokens.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centerFill}>
          <EmptyState
            title="Não foi possível carregar sua Home"
            description="Verifique sua conexão e tente novamente."
          />
        </View>
      </SafeAreaView>
    );
  }

  const progressData = progress.data!;
  const gamificationData = gamification.data!;
  const profileData = profile.data!;

  const consumedCalories = Math.round(progressData.calories.consumed);
  const goalCalories = progressData.calories.goal;
  const remainingCalories = Math.max(0, goalCalories - consumedCalories);
  const calorieProgress = goalCalories > 0 ? consumedCalories / goalCalories : 0;
  const todayLabel = formatFriendlyDate(new Date());

  const rankingEntries = (ranking.data ?? []).slice(0, 3);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={[styles.profilePill, { backgroundColor: tokens.card }]}>
            <Avatar uri={profileData.avatarUrl} displayName={profileData.displayName} size={44} />
            <View style={styles.profileTextWrap}>
              <Text numberOfLines={1} style={[styles.greeting, { color: tokens.text }]}>
                Olá, {profileData.displayName}
              </Text>
              <Text numberOfLines={1} style={[styles.dateText, { color: tokens.textSecondary }]}>
                {todayLabel}
              </Text>
            </View>
          </View>

          <View
            style={[styles.streakPill, { backgroundColor: tokens.card }]}
            accessible
            accessibilityLabel={`Sequência de ${gamificationData.currentStreak} dias`}
          >
            <FireIcon size={16} />
            <Text style={[styles.streakText, { color: tokens.text }]}>{gamificationData.currentStreak}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Alternar tema claro e escuro"
            hitSlop={8}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            style={[styles.iconButton, { backgroundColor: tokens.card }]}
          >
            <ThemeToggleIcon mode={mode} size={19} color={tokens.textSecondary} />
          </Pressable>

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

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summarySide}>
              <Text style={[styles.summarySideValue, { color: tokens.text }]}>{consumedCalories}</Text>
              <Text style={[styles.summarySideLabel, { color: tokens.textSecondary }]}>consumidas</Text>
            </View>

            <View style={styles.ringWrap}>
              <ProgressRing
                progress={calorieProgress}
                size={152}
                strokeWidth={14}
                color={tokens.ring}
                trackColor={tokens.track}
                accessibilityLabel="Progresso de calorias do dia"
              />
              <View style={styles.ringCenter} pointerEvents="none">
                <Text style={[styles.ringValue, { color: tokens.text }]}>{remainingCalories}</Text>
                <Text style={[styles.ringLabel, { color: tokens.textSecondary }]}>kcal restantes</Text>
              </View>
            </View>

            <View style={styles.summarySide}>
              <Text style={[styles.summarySideValue, { color: tokens.text }]}>{goalCalories}</Text>
              <Text style={[styles.summarySideLabel, { color: tokens.textSecondary }]}>meta</Text>
            </View>
          </View>

          <View style={styles.macrosList}>
            <MacroBar
              label="Carboidratos"
              dotColor={tokens.carbs}
              trackColor={tokens.track}
              textColor={tokens.text}
              valueColor={tokens.textSecondary}
              consumed={progressData.carbohydrates.consumed}
              goal={progressData.carbohydrates.goal}
            />
            <MacroBar
              label="Proteínas"
              dotColor={tokens.protein}
              trackColor={tokens.track}
              textColor={tokens.text}
              valueColor={tokens.textSecondary}
              consumed={progressData.protein.consumed}
              goal={progressData.protein.goal}
            />
            <MacroBar
              label="Gorduras"
              dotColor={tokens.fat}
              trackColor={tokens.track}
              textColor={tokens.text}
              valueColor={tokens.textSecondary}
              consumed={progressData.fat.consumed}
              goal={progressData.fat.goal}
            />
          </View>
        </Card>

        <Button
          label="Adicionar refeição"
          variant="dark"
          icon={<PlusIcon size={14} color={tokens.background} />}
          accessibilityHint="Abre a tela de refeições para registrar o que você comeu"
          onPress={() => navigation.navigate('MealsTab', { screen: 'MealsHome' })}
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

        {primaryGroup && (
          <Card style={styles.rankingCard}>
            <View style={styles.rankingHeader}>
              <Text style={[styles.rankingTitle, { color: tokens.text }]}>Ranking do grupo</Text>
              <Text style={[styles.rankingGroupName, { color: tokens.primary }]}>{primaryGroup.name}</Text>
            </View>

            {ranking.isLoading ? (
              <ActivityIndicator color={tokens.primary} />
            ) : (
              <View style={styles.rankingList}>
                {rankingEntries.map((entry) => {
                  const isYou = entry.userId === profileData.id;
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({
  label,
  dotColor,
  trackColor,
  textColor,
  valueColor,
  consumed,
  goal,
}: {
  label: string;
  dotColor: string;
  trackColor: string;
  textColor: string;
  valueColor: string;
  consumed: number;
  goal: number;
}) {
  const ratio = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <View>
      <View style={styles.macroHeaderRow}>
        <View style={styles.macroLabelRow}>
          <View style={[styles.macroDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.macroLabel, { color: textColor }]}>{label}</Text>
        </View>
        <Text style={[styles.macroValue, { color: valueColor }]}>
          {Math.round(consumed)} / {Math.round(goal)} g
        </Text>
      </View>
      <View style={[styles.macroTrack, { backgroundColor: trackColor }]}>
        <View style={[styles.macroFill, { backgroundColor: dotColor, width: `${ratio * 100}%` }]} />
      </View>
    </View>
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
  macroDot: { borderRadius: 4, height: 8, width: 8 },
  macroFill: { borderRadius: 999, height: '100%' },
  macroHeaderRow: { alignItems: 'baseline', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  macroLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13.5, fontWeight: '700' },
  macroLabelRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },

  macroTrack: { borderRadius: 999, height: 6, overflow: 'hidden' },
  macroValue: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600' },
  macrosList: { gap: spacing.md, marginTop: spacing.lg + spacing.xs },
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
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ringLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13, fontWeight: '600', marginTop: 4 },
  ringValue: { fontFamily: 'PlusJakartaSans', fontSize: 40, fontWeight: '800', lineHeight: 44 },
  ringWrap: { alignItems: 'center', height: 152, justifyContent: 'center', width: 152 },
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

  summaryCard: { padding: spacing.lg },
  summaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  // flex:1 (em vez de largura fixa) garante que o anel fique sempre
  // centralizado, dividindo igualmente o espaço que sobra em qualquer
  // largura de tela — o protótipo original tinha 84px fixos, mas isso
  // só cabia na artboard de 440px dele, estourando em celulares reais.
  summarySide: { alignItems: 'center', flex: 1 },
  summarySideLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, fontWeight: '600', marginTop: 2 },
  summarySideValue: { fontFamily: 'PlusJakartaSans', fontSize: 19, fontWeight: '800' },
});
