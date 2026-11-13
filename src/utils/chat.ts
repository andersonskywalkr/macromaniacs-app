import type { GroupFeedItem } from '@/api/types/domain';
import { todayInTimezone } from './today';

export const MAX_MESSAGE_LENGTH = 2000;
// Avisa o usuário perto do limite.
export const MESSAGE_WARNING_LENGTH = 1800;

// Mensagem do chat = postagem do feed. Cronológica (mais antiga primeiro);
// o backend pode devolver em qualquer ordem.
export function sortChronological<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

// "Hoje", "Ontem" ou "dd/mm" (ou "dd/mm/aaaa" em outro ano), no fuso do usuário.
export function dayLabel(iso: string, timezone: string, now: Date = new Date()): string {
  const day = todayInTimezone(timezone, new Date(iso));
  const today = todayInTimezone(timezone, now);
  if (day === today) return 'Hoje';

  const [ty, tm, td] = today.split('-').map(Number);
  const yesterday = todayInTimezone(timezone, new Date(Date.UTC(ty, tm - 1, td, 12) - 24 * 3600 * 1000));
  if (day === yesterday) return 'Ontem';

  const [y, m, d] = day.split('-');
  return y === String(ty) ? `${d}/${m}` : `${d}/${m}/${y}`;
}

export type ChatRow<T> =
  | { type: 'separator'; key: string; label: string }
  | { type: 'message'; key: string; message: T };

// Intercala separadores de dia entre as mensagens (já em ordem cronológica).
export function buildChatRows<T extends { id: string; createdAt: string }>(
  messages: T[],
  timezone: string,
  now: Date = new Date(),
): ChatRow<T>[] {
  const rows: ChatRow<T>[] = [];
  let lastDay = '';
  for (const message of sortChronological(messages)) {
    const day = todayInTimezone(timezone, new Date(message.createdAt));
    if (day !== lastDay) {
      rows.push({ type: 'separator', key: `day-${day}`, label: dayLabel(message.createdAt, timezone, now) });
      lastDay = day;
    }
    rows.push({ type: 'message', key: message.id, message });
  }
  return rows;
}

export function isMealShare(item: Pick<GroupFeedItem, 'mealLogId' | 'content'>): boolean {
  return Boolean(item.mealLogId) && !item.content?.trim();
}
