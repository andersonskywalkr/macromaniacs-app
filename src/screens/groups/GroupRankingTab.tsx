import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RankingEntry } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { MedalIcon } from '@/components/icons';
import { RankingRow } from '@/components/RankingRow';
import { splitPodium } from '@/utils/ranking';

interface GroupRankingTabProps {
  entries: RankingEntry[] | undefined;
  isLoading: boolean;
  isError: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  currentUserId: string | undefined;
  onSeeFull: () => void;
}

// Ordem visual do pódio: 2º, 1º, 3º.
const PODIUM_ORDER = [1, 0, 2];
const PEDESTAL_HEIGHT = [96, 72, 56];

function PodiumColumn({
  entry,
  place,
  isYou,
}: {
  entry: RankingEntry;
  place: number;
  isYou: boolean;
}) {
  const { tokens } = useTheme();
  const name = isYou ? 'Você' : entry.displayName;

  return (
    <View
      accessible
      accessibilityLabel={`${entry.position}º lugar, ${name}, ${entry.points} pontos`}
      style={styles.podiumColumn}
    >
      <MedalIcon rank={(place + 1) as 1 | 2 | 3} size={22} />
      <View style={[styles.avatarRing, isYou && styles.avatarRingYou, isYou && { borderColor: tokens.primary }]}>
        <Avatar isSelf={isYou} displayName={entry.displayName} size={place === 0 ? 60 : 50} />
      </View>
      <Text numberOfLines={1} style={[styles.podiumName, { color: isYou ? tokens.primary : tokens.text }]}>
        {name}
      </Text>
      <Text style={[styles.podiumPoints, { color: tokens.textSecondary }]}>{entry.points} pts</Text>
      <View
        style={[
          styles.pedestal,
          { backgroundColor: isYou ? `${tokens.primary}33` : tokens.card, height: PEDESTAL_HEIGHT[place] },
        ]}
      >
        <Text style={[styles.pedestalNumber, { color: tokens.textSecondary }]}>{entry.position}</Text>
      </View>
    </View>
  );
}

// Aba Ranking: pódio com os 3 primeiros ("Você" em destaque), lista dos
// demais e o botão para o ranking completo.
export function GroupRankingTab({
  entries,
  isLoading,
  isError,
  isRefreshing,
  onRefresh,
  currentUserId,
  onSeeFull,
}: GroupRankingTabProps) {
  const { tokens } = useTheme();

  function renderBody() {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando ranking" />
        </View>
      );
    }
    if (isError || !entries) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar o ranking"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={onRefresh} style={styles.fullWidth} />
        </View>
      );
    }
    if (entries.length === 0) {
      return (
        <EmptyState title="Ranking vazio" description="Quando os membros somarem pontos, eles aparecem aqui." />
      );
    }

    const { podium, others } = splitPodium(entries);
    return (
      <>
        <View style={styles.podium}>
          {PODIUM_ORDER.filter((index) => podium[index]).map((index) => (
            <PodiumColumn
              key={podium[index].userId}
              entry={podium[index]}
              place={index}
              isYou={podium[index].userId === currentUserId}
            />
          ))}
        </View>

        {others.length > 0 && (
          <View style={styles.list}>
            {others.map((entry) => (
              <RankingRow key={entry.userId} entry={entry} isYou={entry.userId === currentUserId} />
            ))}
          </View>
        )}

        <Button
          label="Ver ranking completo"
          variant="secondary"
          onPress={onSeeFull}
          style={styles.seeFull}
        />
      </>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    >
      {renderBody()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatarRing: { borderRadius: 999, marginVertical: spacing.xs },
  avatarRingYou: { borderWidth: 2, padding: 2 },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  content: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  pedestal: {
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    width: '100%',
  },
  pedestalNumber: { fontFamily: fontFamily(800), fontSize: 18 },
  podium: { alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm },
  podiumColumn: { alignItems: 'center', flex: 1, minWidth: 0 },
  podiumName: { fontFamily: fontFamily(700), fontSize: 13.5, maxWidth: '100%' },
  podiumPoints: { fontFamily: fontFamily(700), fontSize: 12.5, marginTop: 1 },
  seeFull: { marginTop: spacing.lg },
});
