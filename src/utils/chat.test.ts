import { buildChatRows, dayLabel, isMealShare, sortChronological } from './chat';

const TZ = 'America/Sao_Paulo';
// 22/10/2026 15:00 em São Paulo
const now = new Date('2026-10-22T18:00:00.000Z');

const msg = (id: string, createdAt: string) => ({ id, createdAt });

describe('dayLabel', () => {
  it('says Hoje, Ontem and a short date', () => {
    expect(dayLabel('2026-10-22T13:00:00.000Z', TZ, now)).toBe('Hoje');
    expect(dayLabel('2026-10-21T13:00:00.000Z', TZ, now)).toBe('Ontem');
    expect(dayLabel('2026-10-18T13:00:00.000Z', TZ, now)).toBe('18/10');
    expect(dayLabel('2025-12-31T13:00:00.000Z', TZ, now)).toBe('31/12/2025');
  });

  it('uses the user day, not the UTC day', () => {
    // 22/10 23:30 em São Paulo = 23/10 02:30 UTC: ainda é "Hoje" para quem está em SP
    const lateNow = new Date('2026-10-23T02:40:00.000Z');
    expect(dayLabel('2026-10-23T02:30:00.000Z', TZ, lateNow)).toBe('Hoje');
  });
});

describe('buildChatRows', () => {
  it('orders chronologically and adds a separator for each day', () => {
    const rows = buildChatRows(
      [
        msg('c', '2026-10-22T16:00:00.000Z'),
        msg('a', '2026-10-21T14:00:00.000Z'),
        msg('b', '2026-10-22T13:00:00.000Z'),
      ],
      TZ,
      now,
    );

    expect(rows.map((r) => (r.type === 'separator' ? `[${r.label}]` : r.message.id))).toEqual([
      '[Ontem]',
      'a',
      '[Hoje]',
      'b',
      'c',
    ]);
  });

  it('has no rows without messages', () => {
    expect(buildChatRows([], TZ, now)).toEqual([]);
  });
});

describe('chat helpers', () => {
  it('sorts oldest first without mutating', () => {
    const input = [msg('b', '2026-10-22T13:00:00.000Z'), msg('a', '2026-10-22T12:00:00.000Z')];
    expect(sortChronological(input).map((m) => m.id)).toEqual(['a', 'b']);
    expect(input[0].id).toBe('b');
  });

  it('recognizes a shared meal post (meal and no text)', () => {
    expect(isMealShare({ mealLogId: 'm1', content: null })).toBe(true);
    expect(isMealShare({ mealLogId: 'm1', content: '  ' })).toBe(true);
    expect(isMealShare({ mealLogId: 'm1', content: 'olha' })).toBe(false);
    expect(isMealShare({ mealLogId: null, content: null })).toBe(false);
  });
});
