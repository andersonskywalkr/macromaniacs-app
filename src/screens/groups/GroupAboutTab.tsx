import React from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import type { GroupSummary, RankingEntry } from '@/api/types/domain';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { RankingRow } from '@/components/RankingRow';
import { sortByPosition } from '@/utils/ranking';

interface GroupAboutTabProps {
  group: GroupSummary;
  entries: RankingEntry[] | undefined;
  memberCount: number | undefined;
  currentUserId: string | undefined;
}

// Papel do usuário no grupo, como vem do backend (valores desconhecidos
// aparecem como estão).
export function roleLabel(role: string | undefined): string {
  switch (role?.toUpperCase()) {
    case 'OWNER':
      return 'Dono';
    case 'ADMIN':
      return 'Administrador';
    case 'MEMBER':
      return 'Membro';
    default:
      return role ?? '—';
  }
}

export function buildInviteMessage(group: Pick<GroupSummary, 'name' | 'inviteCode'>): string {
  return `Entre no grupo "${group.name}" no MacroManiacs! Código de convite: ${group.inviteCode}`;
}

// Aba Sobre: dados do grupo (somente leitura), código de convite com
// "Compartilhar" (Share nativo) e a lista de membros.
export function GroupAboutTab({ group, entries, memberCount, currentUserId }: GroupAboutTabProps) {
  const { tokens } = useTheme();

  async function handleShare() {
    try {
      await Share.share({ message: buildInviteMessage(group) });
    } catch {
      Alert.alert('Não foi possível compartilhar', 'Tente novamente.');
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Nome', value: group.name },
    { label: 'Descrição', value: group.description?.trim() || 'Sem descrição' },
    {
      label: 'Membros',
      value: memberCount === undefined ? '—' : memberCount === 1 ? '1 membro' : `${memberCount} membros`,
    },
    { label: 'Seu papel', value: roleLabel(group.role) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card>
        {rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.infoRow,
              index < rows.length - 1 && styles.infoRowDivider,
              { borderBottomColor: tokens.background },
            ]}
          >
            <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>{row.label}</Text>
            <Text style={[styles.infoValue, { color: tokens.text }]}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.inviteCard}>
        <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>Código de convite</Text>
        <Text
          accessibilityLabel={`Código de convite ${group.inviteCode.split('').join(' ')}`}
          selectable
          style={[styles.code, { color: tokens.primary }]}
        >
          {group.inviteCode}
        </Text>
        <Button label="Compartilhar" variant="secondary" onPress={handleShare} />
      </Card>

      <Text style={[styles.section, { color: tokens.textSecondary }]}>MEMBROS</Text>
      {entries && entries.length > 0 ? (
        <View style={styles.members}>
          {sortByPosition(entries).map((entry) => (
            <RankingRow key={entry.userId} entry={entry} isYou={entry.userId === currentUserId} />
          ))}
        </View>
      ) : (
        <Text style={[styles.infoLabel, { color: tokens.textSecondary }]}>
          A lista de membros não está disponível agora.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  code: { fontFamily: fontFamily(800), fontSize: 26, letterSpacing: 4, marginBottom: spacing.md, marginTop: spacing.xs },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.md },
  infoLabel: { fontFamily: fontFamily(600), fontSize: 13 },
  infoRow: { paddingVertical: spacing.sm + spacing.xs },
  infoRowDivider: { borderBottomWidth: 1 },
  infoValue: { fontFamily: fontFamily(700), fontSize: 15, marginTop: 2 },
  inviteCard: { padding: spacing.lg },
  members: { gap: spacing.sm },
  section: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5, marginTop: spacing.sm },
});
