import React, { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { RankingRow } from '@/components/RankingRow';
import { useGroupRanking } from '@/queries/useGroupRanking';
import { useMyGroups } from '@/queries/useMyGroups';
import { useAuthStore } from '@/store/authStore';
import { sortByPosition } from '@/utils/ranking';

type Props = NativeStackScreenProps<GroupStackParamList, 'RankingFull'>;

// Ranking completo (item 14): todos os membros, "Você" em destaque. A
// sequência por membro só aparece quando o dado existe (mock); o backend real
// não devolve.
export function RankingFullScreen({ navigation, route }: Props) {
  const { groupId } = route.params;
  const { tokens } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const groups = useMyGroups();
  const ranking = useGroupRanking(groupId);
  const [refreshing, setRefreshing] = useState(false);
  const group = groups.data?.find((item) => item.id === groupId);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await ranking.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  function renderBody() {
    if (ranking.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando ranking" />
        </View>
      );
    }
    if (ranking.isError || !ranking.data) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar o ranking"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => ranking.refetch()} style={styles.fullWidth} />
        </View>
      );
    }
    if (ranking.data.length === 0) {
      return (
        <EmptyState title="Ranking vazio" description="Quando os membros somarem pontos, eles aparecem aqui." />
      );
    }
    return (
      <View style={styles.list}>
        {sortByPosition(ranking.data).map((entry) => (
          <RankingRow
            key={entry.userId}
            entry={entry}
            isYou={entry.userId === currentUserId}
            showStreak
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: tokens.text }]}>Ranking completo</Text>
          {group && (
            <Text numberOfLines={1} style={[styles.subtitle, { color: tokens.textSecondary }]}>
              {group.name}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderBody()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  container: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerText: { flex: 1, minWidth: 0 },
  list: { gap: spacing.sm },
  subtitle: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 2 },
  title: { fontFamily: fontFamily(800), fontSize: 22 },
});
