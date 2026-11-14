import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RankingEntry } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { Avatar } from './Avatar';
import { MedalIcon } from './icons';

interface RankingRowProps {
  entry: RankingEntry;
  isYou: boolean;
  // Mostra a sequência do membro (só quando o dado existe, ou seja, no mock).
  showStreak?: boolean;
}

// Uma linha do ranking: posição (medalha no top 3), avatar com iniciais, nome
// ("Você" para o usuário atual) e pontos.
export function RankingRow({ entry, isYou, showStreak = false }: RankingRowProps) {
  const { tokens } = useTheme();
  const name = isYou ? 'Você' : entry.displayName;
  const streak = showStreak && entry.streak !== undefined ? entry.streak : null;

  return (
    <View
      accessible
      accessibilityLabel={`${entry.position}º lugar, ${name}, ${entry.points} pontos${
        streak !== null ? `, ${streak} dias seguidos` : ''
      }`}
      style={[
        styles.row,
        { backgroundColor: isYou ? `${tokens.primary}22` : tokens.card },
        isYou && styles.youRow,
        isYou && { borderColor: tokens.primary },
      ]}
    >
      <View style={styles.position}>
        {entry.position <= 3 ? (
          <MedalIcon rank={entry.position as 1 | 2 | 3} size={20} />
        ) : (
          <Text style={[styles.positionText, { color: tokens.textSecondary }]}>{entry.position}</Text>
        )}
      </View>
      <Avatar isSelf={isYou} displayName={entry.displayName} size={38} />
      <View style={styles.textWrap}>
        <Text numberOfLines={1} style={[styles.name, { color: tokens.text }]}>
          {name}
        </Text>
        {streak !== null && (
          <Text style={[styles.streak, { color: tokens.textSecondary }]}>
            {streak === 1 ? '1 dia seguido' : `${streak} dias seguidos`}
          </Text>
        )}
      </View>
      <Text style={[styles.points, { color: isYou ? tokens.primary : tokens.text }]}>
        {entry.points} pts
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: fontFamily(700), fontSize: 14.5 },
  points: { fontFamily: fontFamily(800), fontSize: 14 },
  position: { alignItems: 'center', justifyContent: 'center', width: 26 },
  positionText: { fontFamily: fontFamily(700), fontSize: 14 },
  row: {
    alignItems: 'center',
    borderRadius: 22,
    flexDirection: 'row',
    gap: spacing.sm + spacing.xs,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  streak: { fontFamily: fontFamily(600), fontSize: 12, marginTop: 1 },
  textWrap: { flex: 1, minWidth: 0 },
  youRow: { borderWidth: 1.5 },
});
