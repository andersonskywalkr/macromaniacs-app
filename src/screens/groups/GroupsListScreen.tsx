import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupStackParamList } from '@/navigation/types';
import type { GroupSummary } from '@/api/types/domain';
import { getJoinGroupErrorMessage } from '@/api/groupErrors';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing, touchTarget } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MedalIcon } from '@/components/icons';
import { TextField } from '@/components/TextField';
import { useGroupRanking } from '@/queries/useGroupRanking';
import { useJoinGroup } from '@/queries/useJoinGroup';
import { useMyGroups } from '@/queries/useMyGroups';
import { useCreateGroup } from '@/queries/useCreateGroup';
import { useAuthStore } from '@/store/authStore';
import { findEntry, sortByPosition } from '@/utils/ranking';
import {
  INVITE_CODE_LENGTH,
  normalizeInviteCode,
  validateInviteCode,
} from '@/validation/groups';

import { KeyboardAwareScreen, KeyboardAwareScrollView } from '@/components/KeyboardAwareScreen';
type Props = NativeStackScreenProps<GroupStackParamList, 'GroupsList'>;

// Largura efetiva (largura da tela ÷ escala da fonte do sistema) abaixo da qual
// "Entrar em grupo" e "Criar grupo" ficam empilhados em vez de lado a lado.
const ACTIONS_STACK_BELOW_WIDTH = 340;

function GroupCard({
  group,
  currentUserId,
  onPress,
}: {
  group: GroupSummary;
  currentUserId: string | undefined;
  onPress: () => void;
}) {
  const { tokens } = useTheme();
  const ranking = useGroupRanking(group.id);
  const entries = ranking.data ? sortByPosition(ranking.data) : undefined;
  // Backend real: contagem = tamanho do ranking; mock: mesma fonte.
  const memberCount = entries?.length ?? group.memberCount;
  const mine = entries ? findEntry(entries, currentUserId) : undefined;
  const countText =
    memberCount === undefined ? '' : memberCount === 1 ? '1 membro' : `${memberCount} membros`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${group.name}${countText ? `, ${countText}` : ''}${
        mine ? `, sua posição ${mine.position}` : ''
      }`}
      accessibilityHint="Abre o perfil do grupo"
      onPress={onPress}
    >
      <Card style={styles.groupCard}>
        <View style={styles.cardHeader}>
          <Avatar uri={null} displayName={group.name} size={48} />
          <View style={styles.cardTitleWrap}>
            <Text numberOfLines={1} style={[styles.groupName, { color: tokens.text }]}>
              {group.name}
            </Text>
            <Text style={[styles.muted, { color: tokens.textSecondary }]}>
              {countText}
              {mine ? `${countText ? ' · ' : ''}Você em ${mine.position}º` : ''}
            </Text>
          </View>
        </View>

        {ranking.isLoading ? (
          <ActivityIndicator color={tokens.primary} style={styles.preview} />
        ) : ranking.isError ? (
          <Text style={[styles.muted, styles.preview, { color: tokens.textSecondary }]}>
            Não foi possível carregar o ranking.
          </Text>
        ) : (
          <View style={styles.preview}>
            {(entries ?? []).slice(0, 3).map((entry) => {
              const isYou = entry.userId === currentUserId;
              return (
                <View key={entry.userId} style={styles.previewRow}>
                  <MedalIcon rank={entry.position as 1 | 2 | 3} size={18} />
                  <Avatar uri={null} displayName={entry.displayName} size={28} />
                  <Text
                    numberOfLines={1}
                    style={[styles.previewName, { color: isYou ? tokens.primary : tokens.text }]}
                  >
                    {isYou ? 'Você' : entry.displayName}
                  </Text>
                  <Text style={[styles.previewPoints, { color: tokens.textSecondary }]}>
                    {entry.points} pts
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Text style={[styles.code, { color: tokens.textSecondary }]}>
          Código de convite: <Text style={[styles.codeValue, { color: tokens.text }]}>{group.inviteCode}</Text>
        </Text>
      </Card>
    </Pressable>
  );
}

// Lista, entrada por convite e criação de grupos reais.
export function GroupsListScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  // Tela estreita ou fonte do sistema ampliada: a largura "efetiva" (em sp)
  // diminui e os dois botões passam a ficar um embaixo do outro.
  const { width, fontScale } = useWindowDimensions();
  const stackActions = width / fontScale < ACTIONS_STACK_BELOW_WIDTH;
  const groups = useMyGroups();
  const join = useJoinGroup();
  const create = useCreateGroup();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinedName, setJoinedName] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await groups.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleJoin() {
    if (join.isPending) return;
    setJoinedName(null);

    const validationError = validateInviteCode(code);
    if (validationError) {
      setJoinError(validationError);
      return;
    }
    setJoinError(null);

    try {
      const joined = await join.mutateAsync(code);
      setJoinedName(joined.name);
      setCode('');
      setJoinOpen(false);
    } catch (error) {
      setJoinError(getJoinGroupErrorMessage(error));
    }
  }

  async function handleCreate() {
    const name = groupName.trim();
    if (name.length < 2) {
      setCreateError('Digite um nome com pelo menos 2 caracteres.');
      return;
    }
    setCreateError(null);
    try {
      const created = await create.mutateAsync({
        name,
        description: groupDescription.trim() || null,
        isPrivate: true,
      });
      setGroupName('');
      setGroupDescription('');
      setCreateOpen(false);
      navigation.navigate('GroupProfile', { groupId: created.id });
    } catch {
      setCreateError('Não foi possível criar o grupo. Tente novamente.');
    }
  }

  function renderBody() {
    if (groups.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando grupos" />
        </View>
      );
    }
    if (groups.isError) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar os grupos"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => groups.refetch()} style={styles.fullWidth} />
        </View>
      );
    }
    if (!groups.data || groups.data.length === 0) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Você ainda não está em nenhum grupo"
            description="Peça um código de convite a quem já participa e toque em “Entrar em um grupo”."
          />
        </View>
      );
    }
    return (
      <View style={styles.list}>
        {groups.data.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            currentUserId={currentUserId}
            onPress={() => navigation.navigate('GroupProfile', { groupId: group.id })}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <KeyboardAwareScreen>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text style={[styles.title, { color: tokens.text }]}>Grupos</Text>

        {/* Rótulos curtos ("Cancelar" no lugar de "Cancelar entrada/criação"): o
            botão do formulário aberto fica preenchido, para o contexto ficar claro. */}
        <View testID="group-actions" style={stackActions ? styles.actionsColumn : styles.actionsRow}>
          <Button
            label={joinOpen ? 'Cancelar' : 'Entrar em grupo'}
            variant={joinOpen ? 'primary' : 'secondary'}
            onPress={() => {
              setJoinOpen((open) => !open);
              setCreateOpen(false);
              setJoinError(null);
            }}
            accessibilityHint={
              joinOpen ? 'Fecha o campo do código de convite' : 'Mostra o campo do código de convite'
            }
            style={stackActions ? styles.actionButtonStacked : styles.actionButton}
          />
          <Button
            label={createOpen ? 'Cancelar' : 'Criar grupo'}
            variant={createOpen ? 'primary' : 'secondary'}
            onPress={() => {
              setCreateOpen((open) => !open);
              setJoinOpen(false);
              setCreateError(null);
            }}
            accessibilityHint={
              createOpen ? 'Fecha o formulário de novo grupo' : 'Mostra o formulário de novo grupo'
            }
            style={stackActions ? styles.actionButtonStacked : styles.actionButton}
          />
        </View>

        {joinOpen && (
          <Card style={styles.joinCard}>
            <Text style={[styles.joinLabel, { color: tokens.textSecondary }]}>Código de convite</Text>
            <TextField
              accessibilityLabel="Código de convite"
              placeholder="8 letras e números"
              value={code}
              onChangeText={(value) => {
                setCode(normalizeInviteCode(value));
                setJoinError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={INVITE_CODE_LENGTH}
              onSubmitEditing={handleJoin}
              returnKeyType="done"
            />
            {joinError && (
              <Text accessibilityRole="alert" style={[styles.joinError, { color: tokens.danger }]}>
                {joinError}
              </Text>
            )}
            <Button label="Entrar" onPress={handleJoin} loading={join.isPending} style={styles.joinButton} />
          </Card>
        )}

        {createOpen && (
          <Card style={styles.joinCard}>
            <Text style={[styles.joinLabel, { color: tokens.textSecondary }]}>Novo grupo</Text>
            <TextField
              accessibilityLabel="Nome do grupo"
              placeholder="Nome do grupo"
              value={groupName}
              onChangeText={(value) => { setGroupName(value); setCreateError(null); }}
              maxLength={100}
            />
            <TextField
              accessibilityLabel="Descrição do grupo"
              placeholder="Descrição (opcional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              maxLength={1000}
              multiline
            />
            {createError && <Text accessibilityRole="alert" style={[styles.joinError, { color: tokens.danger }]}>{createError}</Text>}
            <Button label="Criar grupo privado" onPress={handleCreate} loading={create.isPending} style={styles.joinButton} />
          </Card>
        )}

        {joinedName && (
          <Text accessibilityRole="alert" style={[styles.joined, { color: tokens.primary }]}>
            Você entrou em “{joinedName}”.
          </Text>
        )}

        {renderBody()}
      </KeyboardAwareScrollView>
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: { flex: 1, paddingHorizontal: spacing.sm },
  actionButtonStacked: { alignSelf: 'stretch' },
  actionsColumn: { flexDirection: 'column', gap: spacing.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  centered: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  code: { fontFamily: fontFamily(600), fontSize: 12.5, marginTop: spacing.md },
  codeValue: { fontFamily: fontFamily(800), letterSpacing: 1 },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg },
  fullWidth: { alignSelf: 'stretch' },
  groupCard: { padding: spacing.lg },
  groupName: { fontFamily: fontFamily(800), fontSize: 17 },
  joinButton: { marginTop: spacing.md },
  joinCard: { padding: spacing.lg },
  joinError: { fontFamily: fontFamily(600), fontSize: 13, marginTop: spacing.sm },
  joinLabel: { fontFamily: fontFamily(800), fontSize: 12.5, marginBottom: spacing.sm },
  joined: { fontFamily: fontFamily(800), fontSize: 14, textAlign: 'center' },
  list: { gap: spacing.md },
  muted: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 2 },
  preview: { gap: spacing.sm, marginTop: spacing.md },
  previewName: { flex: 1, fontFamily: fontFamily(700), fontSize: 14, minWidth: 0 },
  previewPoints: { fontFamily: fontFamily(700), fontSize: 13 },
  previewRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: touchTarget.minSize - 12 },
  title: { fontFamily: fontFamily(800), fontSize: 26 },
});
