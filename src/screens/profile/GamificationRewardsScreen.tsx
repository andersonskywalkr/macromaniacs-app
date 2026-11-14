import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import type { InventoryItem, RewardItem } from '@/api/types/domain';
import { ApiError } from '@/api/ApiError';
import { createIdempotencyKey } from '@/api/idempotency';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { useAchievements, useDailyMissions } from '@/queries/useGamificationDetails';
import {
  useEquipReward,
  usePurchaseReward,
  useRewardBalance,
  useRewardCatalog,
  useRewardInventory,
} from '@/queries/useRewards';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/fonts';
import { spacing } from '@/theme/tokens';

type Props = NativeStackScreenProps<ProfileStackParamList, 'GamificationRewards'>;

const TYPE_LABELS: Record<string, string> = {
  TAG: 'Título',
  AVATAR: 'Avatar',
  FRAME: 'Moldura',
  BACKGROUND: 'Fundo',
};

function rewardError(error: unknown): string {
  if (error instanceof ApiError && error.statusCode === 409) return error.message;
  if (error instanceof ApiError && error.isNetworkError) return 'Sem conexão. Tente novamente mantendo esta compra.';
  return 'Não foi possível concluir a operação.';
}

function RewardCard({
  item,
  owned,
  balance,
  busy,
  onPurchase,
  onEquip,
}: {
  item: RewardItem;
  owned: InventoryItem | undefined;
  balance: number;
  busy: boolean;
  onPurchase: () => void;
  onEquip: () => void;
}) {
  const { tokens } = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.flex}>
          <Text style={[styles.itemTitle, { color: tokens.text }]}>{item.name}</Text>
          <Text style={[styles.muted, { color: tokens.textSecondary }]}>
            {TYPE_LABELS[item.type] ?? item.type} · {item.price} pontos
          </Text>
          {item.description ? (
            <Text style={[styles.description, { color: tokens.textSecondary }]}>{item.description}</Text>
          ) : null}
        </View>
      </View>
      {owned ? (
        <Button
          label={owned.isEquipped ? 'Equipado' : 'Equipar'}
          variant="secondary"
          disabled={owned.isEquipped}
          loading={busy}
          onPress={onEquip}
          style={styles.action}
        />
      ) : (
        <Button
          label="Comprar"
          disabled={balance < item.price}
          loading={busy}
          onPress={onPurchase}
          style={styles.action}
        />
      )}
    </Card>
  );
}

export function GamificationRewardsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const userId = useAuthStore((state) => state.user?.id) ?? 'anonymous';
  const missions = useDailyMissions();
  const achievements = useAchievements();
  const catalog = useRewardCatalog();
  const balance = useRewardBalance();
  const inventory = useRewardInventory();
  const purchase = usePurchaseReward();
  const equip = useEquipReward();
  const purchaseKeys = useRef<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const loading = [missions, achievements, catalog, balance, inventory].some((query) => query.isLoading);
  const failed = [missions, achievements, catalog, balance, inventory].some((query) => query.isError);
  const ownedById = new Map((inventory.data ?? []).map((item) => [item.id, item]));

  async function handlePurchase(itemId: string) {
    const key = purchaseKeys.current[itemId] ?? createIdempotencyKey('reward', userId);
    purchaseKeys.current[itemId] = key;
    setError(null);
    try {
      await purchase.mutateAsync({ itemId, idempotencyKey: key });
      delete purchaseKeys.current[itemId];
    } catch (cause) {
      setError(rewardError(cause));
    }
  }

  async function handleEquip(itemId: string) {
    setError(null);
    try {
      await equip.mutateAsync(itemId);
    } catch (cause) {
      setError(rewardError(cause));
    }
  }

  function retryAll() {
    void Promise.all([
      missions.refetch(),
      achievements.refetch(),
      catalog.refetch(),
      balance.refetch(),
      inventory.refetch(),
    ]);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.title, { color: tokens.text }]}>Conquistas e recompensas</Text>
      </View>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.primary} size="large" accessibilityLabel="Carregando recompensas" />
        </View>
      ) : failed ? (
        <View style={styles.centered}>
          <EmptyState title="Não foi possível carregar" description="Verifique sua conexão e tente novamente." />
          <Button label="Tentar de novo" onPress={retryAll} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={styles.balanceCard}>
            <Text style={[styles.section, { color: tokens.textSecondary }]}>SALDO</Text>
            <Text style={[styles.balance, { color: tokens.text }]}>{balance.data ?? 0} pontos</Text>
          </Card>

          {error && <Text accessibilityRole="alert" style={[styles.error, { color: tokens.danger }]}>{error}</Text>}

          <Text style={[styles.section, { color: tokens.textSecondary }]}>MISSÕES DE HOJE</Text>
          {(missions.data ?? []).map((mission) => (
            <Card key={mission.id} style={styles.card}>
              <Text style={[styles.itemTitle, { color: tokens.text }]}>{mission.title}</Text>
              <Text style={[styles.muted, { color: tokens.textSecondary }]}>
                {mission.currentProgress}/{mission.targetCount} · +{mission.pointsReward} pontos
                {mission.completed ? ' · concluída' : ''}
              </Text>
            </Card>
          ))}

          <Text style={[styles.section, { color: tokens.textSecondary }]}>CONQUISTAS</Text>
          {(achievements.data ?? []).length === 0 ? (
            <Text style={[styles.muted, { color: tokens.textSecondary }]}>Nenhuma conquista desbloqueada ainda.</Text>
          ) : (achievements.data ?? []).map((achievement) => (
            <Card key={achievement.id} style={styles.card}>
              <Text style={[styles.itemTitle, { color: tokens.text }]}>{achievement.title}</Text>
              {achievement.description ? <Text style={[styles.description, { color: tokens.textSecondary }]}>{achievement.description}</Text> : null}
            </Card>
          ))}

          <Text style={[styles.section, { color: tokens.textSecondary }]}>LOJA</Text>
          {(catalog.data ?? []).map((item) => (
            <RewardCard
              key={item.id}
              item={item}
              owned={ownedById.get(item.id)}
              balance={balance.data ?? 0}
              busy={(purchase.isPending && purchase.variables?.itemId === item.id) || (equip.isPending && equip.variables === item.id)}
              onPurchase={() => void handlePurchase(item.id)}
              onEquip={() => void handleEquip(item.id)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  action: { marginTop: spacing.md },
  balance: { fontFamily: fontFamily(800), fontSize: 28 },
  balanceCard: { padding: spacing.lg },
  card: { padding: spacing.lg },
  centered: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.lg },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingTop: spacing.sm },
  description: { fontFamily: fontFamily(500), fontSize: 13, marginTop: spacing.xs },
  error: { fontFamily: fontFamily(700), fontSize: 13, textAlign: 'center' },
  flex: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.sm },
  itemTitle: { fontFamily: fontFamily(800), fontSize: 16 },
  muted: { fontFamily: fontFamily(600), fontSize: 13, marginTop: 2 },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  section: { fontFamily: fontFamily(800), fontSize: 12.5, letterSpacing: 0.5 },
  title: { flex: 1, fontFamily: fontFamily(800), fontSize: 21 },
});
