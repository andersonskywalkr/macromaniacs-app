import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, touchTarget } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ChoicePill } from '@/components/ChoicePill';
import { InlineRetry } from '@/components/InlineRetry';
import { ProgressRing } from '@/components/ProgressRing';
import { ChevronRightIcon, FireIcon } from '@/components/icons';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, type ThemePreference } from '@/store/themeStore';
import { useGamificationStats } from '@/queries/useGamificationStats';
import { useProgressToday } from '@/queries/useProgressToday';
import { summarizeCalories } from '@/utils/dailyProgress';
import { formatDecimal } from '@/utils/nutrition';
import { buildStreakWeek } from '@/utils/streak';
import { resolveCalorieGoal } from '@/utils/nutritionFallback';
import { CompleteProfileNotice } from '@/components/CompleteProfileNotice';
import { TERMS_OPEN_ERROR_MESSAGE, openTermsDocument } from '@/utils/terms';
import { resolveTimezone, todayAsLocalDate } from '@/utils/today';
import { GOAL_LABELS } from '@/screens/onboarding/types';

import { fontFamily } from '@/theme/fonts';
type Props = NativeStackScreenProps<ProfileStackParamList, 'ProfileHome'>;

const APPEARANCE_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Automático (seguir o celular)' },
];

const SAVED_MESSAGE_MS = 4000;

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você precisará entrar de novo para usar o app.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Sair', style: 'destructive', onPress: () => useAuthStore.getState().signOut() },
  ]);
}

// Perfil do usuário (item 15), a partir de "Perfil Minimalista". Do protótipo
// ficaram de fora nível/XP e medalhas: a API de gamificação só devolve
// pontos, sequência atual e melhor sequência.
export function ProfileHomeScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const user = useAuthStore((state) => state.user);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const gamification = useGamificationStats();
  const progress = useProgressToday();
  const [showSaved, setShowSaved] = useState(false);
  const [termsLinkError, setTermsLinkError] = useState(false);

  // Confirmação curta depois de salvar no Editar perfil.
  const savedParam = route.params?.saved;
  useEffect(() => {
    if (!savedParam) return undefined;
    setShowSaved(true);
    navigation.setParams({ saved: undefined });
    const timer = setTimeout(() => setShowSaved(false), SAVED_MESSAGE_MS);
    return () => clearTimeout(timer);
  }, [savedParam, navigation]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando perfil" />
        </View>
      </SafeAreaView>
    );
  }

  async function handleOpenTerms() {
    setTermsLinkError(false);
    const opened = await openTermsDocument();
    if (!opened) setTermsLinkError(true);
  }

  const name = user.displayName ?? user.username;
  const calorieGoal = resolveCalorieGoal(user) ?? progress.data?.calories.goal ?? null;
  const goalLabel = user.goal ? GOAL_LABELS[user.goal] : undefined;
  const currentWeight = user.currentMeasurement?.weightKg;

  function renderToday() {
    if (!calorieGoal && !user!.biologicalSex) {
      return <CompleteProfileNotice onPress={() => navigation.navigate('EditProfile')} />;
    }
    if (progress.isLoading) {
      return <ActivityIndicator color={tokens.primary} accessibilityLabel="Carregando seu dia" />;
    }
    if (progress.isError || !progress.data || calorieGoal === null) {
      return (
        <InlineRetry message="Não foi possível carregar o seu dia." onRetry={() => progress.refetch()} />
      );
    }

    const summary = summarizeCalories(calorieGoal, progress.data.calories.consumed);
    return (
      <View style={styles.todayRow}>
        <View style={styles.ringWrap}>
          <ProgressRing
            progress={summary.ringProgress}
            size={96}
            strokeWidth={9}
            color={tokens.ring}
            trackColor={tokens.track}
            accessibilityLabel={`Calorias de hoje: ${summary.percent}% da meta`}
          />
          <View style={styles.ringCenter} pointerEvents="none">
            <Text style={[styles.ringValue, { color: tokens.text }]}>{Math.round(summary.consumed)}</Text>
            <Text style={[styles.ringUnit, { color: tokens.textSecondary }]}>kcal</Text>
          </View>
        </View>
        <View style={styles.todayText}>
          <Text style={[styles.bigValue, { color: tokens.text }]}>
            {Math.round(summary.remaining)} kcal restantes
          </Text>
          <Text style={[styles.muted, { color: tokens.textSecondary }]}>
            Meta de hoje: {Math.round(summary.goal)} kcal
          </Text>
          {summary.over > 0 && (
            <Text style={[styles.muted, { color: tokens.danger }]}>
              {Math.round(summary.over)} kcal acima da meta
            </Text>
          )}
        </View>
      </View>
    );
  }

  function renderStreak() {
    if (gamification.isLoading) {
      return <ActivityIndicator color={tokens.primary} accessibilityLabel="Carregando sequência" />;
    }
    if (gamification.isError || !gamification.data) {
      return (
        <InlineRetry
          message="Não foi possível carregar seus pontos e sua sequência."
          onRetry={() => gamification.refetch()}
        />
      );
    }

    const { points, currentStreak, bestStreak } = gamification.data;
    const week = buildStreakWeek(currentStreak, todayAsLocalDate(resolveTimezone(user?.timezone)));
    return (
      <>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.bigValue, { color: tokens.text }]}>{points}</Text>
            <Text style={[styles.muted, { color: tokens.textSecondary }]}>pontos</Text>
          </View>
          <View style={styles.stat}>
            <View style={styles.streakValue}>
              <FireIcon size={18} />
              <Text style={[styles.bigValue, { color: tokens.text }]}>{currentStreak}</Text>
            </View>
            <Text style={[styles.muted, { color: tokens.textSecondary }]}>
              {currentStreak === 1 ? 'dia seguido' : 'dias seguidos'}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.bigValue, { color: tokens.text }]}>{bestStreak}</Text>
            <Text style={[styles.muted, { color: tokens.textSecondary }]}>melhor sequência</Text>
          </View>
        </View>

        <View
          accessible
          accessibilityLabel={`Últimos 7 dias: ${Math.min(currentStreak, 7)} dias com registro`}
          style={styles.weekRow}
        >
          {week.map((day, index) => (
            <View key={index} style={styles.weekDay}>
              <View
                style={[
                  styles.weekDot,
                  { backgroundColor: day.done ? tokens.primary : tokens.track },
                  day.isToday && styles.weekDotToday,
                  day.isToday && { borderColor: tokens.primary },
                ]}
              />
              <Text style={[styles.weekLabel, { color: tokens.textSecondary }]}>{day.label}</Text>
            </View>
          ))}
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Personalizar avatar"
              accessibilityHint="Abre a personalização do avatar"
              hitSlop={8}
              onPress={() => navigation.navigate('AvatarCustomizer')}
            >
              <Avatar isSelf displayName={name} size={64} />
            </Pressable>
            <View style={styles.headerText}>
              <Text numberOfLines={1} style={[styles.name, { color: tokens.text }]}>
                {name}
              </Text>
              <Text numberOfLines={1} style={[styles.muted, { color: tokens.textSecondary }]}>
                @{user.username}
              </Text>
              <Text numberOfLines={1} style={[styles.muted, { color: tokens.textSecondary }]}>
                {user.email}
              </Text>
            </View>
          </View>
          <Button
            label="Editar perfil"
            variant="secondary"
            onPress={() => navigation.navigate('EditProfile')}
            style={styles.editButton}
          />
        </Card>

        {showSaved && (
          <Text accessibilityRole="alert" style={[styles.saved, { color: tokens.primary }]}>
            Perfil atualizado.
          </Text>
        )}

        <Card style={styles.card}>
          <Text style={[styles.section, { color: tokens.textSecondary }]}>HOJE</Text>
          {renderToday()}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.section, { color: tokens.textSecondary }]}>PONTOS E SEQUÊNCIA</Text>
          {renderStreak()}
          <Button
            label="Ver conquistas e recompensas"
            variant="secondary"
            onPress={() => navigation.navigate('GamificationRewards')}
            style={styles.rewardsButton}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.section, { color: tokens.textSecondary }]}>SEU OBJETIVO</Text>
          <View style={styles.goalRows}>
            <GoalRow label="Objetivo" value={goalLabel ?? '—'} />
            <GoalRow
              label="Meta calórica"
              value={!calorieGoal ? '—' : `${Math.round(calorieGoal)} kcal/dia`}
            />
            <GoalRow
              label="Peso atual"
              value={currentWeight === undefined ? '—' : `${formatDecimal(currentWeight)} kg`}
            />
            <GoalRow
              label="Peso-alvo"
              value={user.targetWeightKg === null ? '—' : `${formatDecimal(user.targetWeightKg)} kg`}
            />
          </View>
        </Card>

        <View style={styles.appearance}>
          <Text style={[styles.section, { color: tokens.textSecondary }]}>APARÊNCIA</Text>
          <View accessibilityRole="radiogroup" style={styles.options}>
            {APPEARANCE_OPTIONS.map((option) => (
              <ChoicePill
                key={option.value}
                variant="inverted"
                label={option.label}
                selected={preference === option.value}
                onPress={() => setPreference(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.account}>
          <Text style={[styles.section, { color: tokens.textSecondary }]}>CONTA</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Termos de Uso e Privacidade"
            accessibilityHint="Abre o documento no navegador"
            onPress={handleOpenTerms}
            style={[styles.accountRow, { backgroundColor: tokens.card }]}
          >
            <Text style={[styles.accountRowText, { color: tokens.text }]}>Termos de Uso e Privacidade</Text>
            <View style={styles.accountChevron}>
              <ChevronRightIcon size={10} color={tokens.textSecondary} />
            </View>
          </Pressable>
          {termsLinkError && (
            <Text accessibilityRole="alert" style={[styles.accountError, { color: tokens.textSecondary }]}>
              {TERMS_OPEN_ERROR_MESSAGE}
            </Text>
          )}
        </View>

        <Button label="Sair" variant="secondary" onPress={confirmSignOut} style={styles.signOutButton} />
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalRow({ label, value }: { label: string; value: string }) {
  const { tokens } = useTheme();
  return (
    <View style={styles.goalRow}>
      <Text style={[styles.muted, { color: tokens.textSecondary }]}>{label}</Text>
      <Text style={[styles.goalValue, { color: tokens.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  account: { marginTop: spacing.sm },
  accountChevron: { alignItems: 'center', justifyContent: 'center' },
  accountError: { fontFamily: fontFamily(600), fontSize: 12.5, marginTop: spacing.sm },
  accountRow: {
    alignItems: 'center',
    borderRadius: radius.card / 2,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  accountRowText: { flex: 1, fontFamily: fontFamily(700), fontSize: 15 },
  appearance: { marginTop: spacing.sm },
  bigValue: { fontFamily: fontFamily(800), fontSize: 20 },
  card: { padding: spacing.lg },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg },
  editButton: { marginTop: spacing.lg },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  goalRows: { gap: spacing.sm + spacing.xs, marginTop: spacing.md },
  goalValue: { fontFamily: fontFamily(800), fontSize: 14.5 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  headerText: { flex: 1, minWidth: 0 },
  muted: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 2 },
  name: { fontFamily: fontFamily(800), fontSize: 20 },
  options: { gap: spacing.sm },
  rewardsButton: { marginTop: spacing.lg },
  ringCenter: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ringUnit: { fontFamily: fontFamily(600), fontSize: 11 },
  ringValue: { fontFamily: fontFamily(800), fontSize: 20 },
  ringWrap: { height: 96, width: 96 },
  saved: { fontFamily: fontFamily(800), fontSize: 14, textAlign: 'center' },
  section: {
    fontFamily: fontFamily(800),
    fontSize: 12.5,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  signOutButton: { alignSelf: 'center', marginTop: spacing.md, minWidth: 160 },
  stat: { alignItems: 'center', flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streakValue: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  todayRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.lg },
  todayText: { flex: 1, minWidth: 0 },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  weekDot: { borderRadius: 999, height: 28, width: 28 },
  weekDotToday: { borderWidth: 2 },
  weekLabel: { fontFamily: fontFamily(700), fontSize: 11.5 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg },
});
