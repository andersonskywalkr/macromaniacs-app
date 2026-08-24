import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CreateMealInput } from '@/api/meals';

/**
 * Fila local de escrita offline — seção 125.2.
 *
 * Nota de implementação: o documento recomenda expo-sqlite ou MMKV para
 * melhor performance em produção. Começamos com AsyncStorage aqui porque
 * é zero-config e suficiente para o volume de dados do MVP (poucas
 * refeições pendentes por vez); trocar a implementação interna depois
 * não deve exigir mudar a assinatura destas funções.
 */

const OUTBOX_KEY = 'macromaniacs:meals-outbox';

interface OutboxEntry {
  id: string;
  input: CreateMealInput;
  createdAt: string;
}

async function readOutbox(): Promise<OutboxEntry[]> {
  const raw = await AsyncStorage.getItem(OUTBOX_KEY);
  return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
}

async function writeOutbox(entries: OutboxEntry[]): Promise<void> {
  await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
}

export async function enqueueOfflineMeal(input: CreateMealInput): Promise<void> {
  const entries = await readOutbox();
  entries.push({ id: `pending-${Date.now()}`, input, createdAt: new Date().toISOString() });
  await writeOutbox(entries);
}

export async function getPendingMeals(): Promise<OutboxEntry[]> {
  return readOutbox();
}

export async function removePendingMeal(id: string): Promise<void> {
  const entries = await readOutbox();
  await writeOutbox(entries.filter((e) => e.id !== id));
}
