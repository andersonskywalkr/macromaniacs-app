import {
  FALLBACK_TIMEZONE,
  getDeviceTimezone,
  resolveTimezone,
  todayAsLocalDate,
  todayInTimezone,
} from './today';

describe('todayInTimezone', () => {
  it('is the user day, not the UTC day, at the day turn (23h30 in São Paulo)', () => {
    // 22/10 23:30 em São Paulo (UTC-3) = 23/10 02:30 em UTC
    const instant = new Date('2026-10-23T02:30:00.000Z');
    expect(todayInTimezone('America/Sao_Paulo', instant)).toBe('2026-10-22');
    expect(todayInTimezone('UTC', instant)).toBe('2026-10-23');
  });

  it('turns to the next day after midnight in the user timezone', () => {
    // 23/10 00:30 em São Paulo = 23/10 03:30 em UTC
    expect(todayInTimezone('America/Sao_Paulo', new Date('2026-10-23T03:30:00.000Z'))).toBe('2026-10-23');
  });

  it('works for zones ahead of UTC', () => {
    // 23/10 02:30 UTC = 23/10 11:30 em Tóquio; 22/10 23:30 UTC = 23/10 08:30 em Tóquio
    expect(todayInTimezone('Asia/Tokyo', new Date('2026-10-22T23:30:00.000Z'))).toBe('2026-10-23');
  });

  it('falls back to the device date for an invalid timezone', () => {
    const now = new Date(2026, 9, 22, 10, 0);
    expect(todayInTimezone('Nao/Existe', now)).toBe('2026-10-22');
  });
});

describe('todayAsLocalDate', () => {
  it('returns a local date at midnight for the user day', () => {
    const date = todayAsLocalDate('America/Sao_Paulo', new Date('2026-10-23T02:30:00.000Z'));
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 22]);
  });
});

describe('timezone resolution', () => {
  it('prefers the profile timezone and falls back to the device one', () => {
    expect(resolveTimezone('Europe/Lisbon')).toBe('Europe/Lisbon');
    expect(resolveTimezone(null)).toBe(getDeviceTimezone());
    expect(resolveTimezone('  ')).toBe(getDeviceTimezone());
  });

  it('has a default for engines without Intl timezone support', () => {
    const original = Intl.DateTimeFormat;
    // @ts-expect-error simulando engine sem suporte
    Intl.DateTimeFormat = () => {
      throw new Error('sem Intl');
    };
    try {
      expect(getDeviceTimezone()).toBe(FALLBACK_TIMEZONE);
    } finally {
      Intl.DateTimeFormat = original;
    }
  });
});
