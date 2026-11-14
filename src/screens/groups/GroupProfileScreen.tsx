import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GroupStackParamList } from '@/navigation/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing, touchTarget } from '@/theme/tokens';
import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useGroupRanking } from '@/queries/useGroupRanking';
import { useMyGroups } from '@/queries/useMyGroups';
import { useAuthStore } from '@/store/authStore';
import { GroupAboutTab } from './GroupAboutTab';
import { GroupChatTab } from './GroupChatTab';
import { GroupRankingTab } from './GroupRankingTab';
import { useLeaveGroup } from '@/queries/useLeaveGroup';

import { KeyboardAwareScreen } from '@/components/KeyboardAwareScreen';
type Props = NativeStackScreenProps<GroupStackParamList, 'GroupProfile'>;

export const GROUP_TABS = ['Ranking', 'Chat', 'Sobre'] as const;
export type GroupTab = (typeof GROUP_TABS)[number];

export function memberCountLabel(count: number | undefined): string | null {
  if (count === undefined) return null;
  return count === 1 ? '1 membro' : `${count} membros`;
}

// Perfil do grupo (item 13). Parte do desenho do Felipe (cabeçalho com o
// grupo, quatro abas e chat), agora ligado ao app: dados do grupo e do
// ranking vêm da API (ou do mock), o chat usa o feed do grupo e a barra
// inferior é a do app. Ficam de fora: foto no chat, foto e descrição editáveis
// (o backend não suporta).
export function GroupProfileScreen({ navigation, route }: Props) {
  const { groupId, origin } = route.params;
  const { tokens } = useTheme();
  const isFocused = useIsFocused();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const groups = useMyGroups();
  const ranking = useGroupRanking(groupId);
  const leave = useLeaveGroup();
  const [activeTab, setActiveTab] = useState<GroupTab>('Ranking');
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  // Digitando no chat o teclado ocupa metade da tela: o cartão do grupo some
  // para a lista de mensagens ter espaço.
  const compact = keyboardVisible && activeTab === 'Chat';
  const [refreshingRanking, setRefreshingRanking] = useState(false);

  const group = groups.data?.find((item) => item.id === groupId);
  // Backend real: o tamanho do ranking é a contagem de membros. No mock, o
  // ranking e o memberCount saem da mesma fonte.
  const memberCount = ranking.data?.length ?? group?.memberCount;

  function handleBack() {
    if (origin === 'home') {
      // Aberto pela Home: deixa a pilha do Grupo na lista e volta à Home.
      navigation.reset({ index: 0, routes: [{ name: 'GroupsList' }] });
      navigation.getParent()?.navigate('HomeTab');
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('GroupsList');
    }
  }

  async function refreshRanking() {
    setRefreshingRanking(true);
    try {
      await ranking.refetch();
    } finally {
      setRefreshingRanking(false);
    }
  }

  function confirmLeave() {
    Alert.alert('Sair do grupo?', 'Você deixará de ver o feed e o ranking deste grupo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await leave.mutateAsync(groupId);
            navigation.reset({ index: 0, routes: [{ name: 'GroupsList' }] });
          } catch {
            Alert.alert('Não foi possível sair', 'Tente novamente ou verifique seu papel no grupo.');
          }
        },
      },
    ]);
  }

  function renderContent() {
    if (!group) return null;
    switch (activeTab) {
      case 'Ranking':
        return (
          <GroupRankingTab
            entries={ranking.data}
            isLoading={ranking.isLoading}
            isError={ranking.isError}
            isRefreshing={refreshingRanking}
            onRefresh={refreshRanking}
            currentUserId={currentUserId}
            onSeeFull={() => navigation.navigate('RankingFull', { groupId })}
          />
        );
      case 'Chat':
        return <GroupChatTab groupId={groupId} live={isFocused} />;
      case 'Sobre':
        return (
          <GroupAboutTab
            group={group}
            entries={ranking.data}
            memberCount={memberCount}
            currentUserId={currentUserId}
            onLeave={confirmLeave}
            leaving={leave.isPending}
          />
        );
    }
  }

  function renderBody() {
    if (groups.isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando grupo" />
        </View>
      );
    }
    if (groups.isError) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Não foi possível carregar o grupo"
            description="Verifique sua conexão e tente novamente."
          />
          <Button label="Tentar de novo" onPress={() => groups.refetch()} style={styles.fullWidth} />
        </View>
      );
    }
    if (!group) {
      return (
        <View style={styles.centered}>
          <EmptyState
            title="Grupo não encontrado"
            description="Você pode ter saído dele ou o código mudou."
          />
        </View>
      );
    }

    const countLabel = memberCountLabel(memberCount);
    return (
      <>
        {!compact && (
        <View style={[styles.groupCard, { backgroundColor: tokens.card }]}>
          <Avatar uri={null} displayName={group.name} size={56} />
          <View style={styles.groupInfo}>
            <Text numberOfLines={1} style={[styles.groupTitle, { color: tokens.text }]}>
              {group.name}
            </Text>
            {countLabel && (
              <Text style={[styles.groupMembers, { color: tokens.textSecondary }]}>{countLabel}</Text>
            )}
            {group.description ? (
              <Text numberOfLines={2} style={[styles.groupTagline, { color: tokens.textSecondary }]}>
                {group.description}
              </Text>
            ) : null}
          </View>
        </View>
        )}

        <View accessibilityRole="tablist" style={[styles.tabsRow, { borderBottomColor: tokens.track }]}>
          {GROUP_TABS.map((tab) => {
            const selected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="tab"
                accessibilityLabel={tab}
                accessibilityState={{ selected }}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabItem,
                  selected && styles.activeTabItem,
                  selected && { borderBottomColor: tokens.primary },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: selected ? tokens.primary : tokens.textSecondary },
                    selected && styles.activeTabText,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabContent}>{renderContent()}</View>
      </>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]} edges={['top']}>
      <KeyboardAwareScreen>
        <View style={styles.topHeader}>
          <BackButton onPress={handleBack} />
          <Text style={[styles.headerTitle, { color: tokens.text }]}>Grupos</Text>
        </View>
        {renderBody()}
      </KeyboardAwareScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeTabItem: { borderBottomWidth: 2 },
  activeTabText: { fontFamily: fontFamily(700) },
  centered: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  container: { flex: 1 },
  fullWidth: { alignSelf: 'stretch' },
  groupCard: {
    alignItems: 'center',
    borderRadius: 28,
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
  groupInfo: { flex: 1, marginLeft: 14, minWidth: 0 },
  groupMembers: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 1 },
  groupTagline: { fontFamily: fontFamily(500), fontSize: 13, marginTop: 4 },
  groupTitle: { fontFamily: fontFamily(700), fontSize: 18 },
  headerTitle: { fontFamily: fontFamily(800), fontSize: 22 },
  tabContent: { flex: 1 },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: touchTarget.minSize,
    paddingHorizontal: spacing.sm,
  },
  tabText: { fontFamily: fontFamily(500), fontSize: 15 },
  tabsRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  topHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
