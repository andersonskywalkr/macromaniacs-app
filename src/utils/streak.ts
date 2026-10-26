export interface StreakDay {
  label: string;
  done: boolean;
  isToday: boolean;
}

const WEEKDAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Grade dos últimos 7 dias (o mais antigo primeiro, hoje por último). Os
// últimos `currentStreak` dias aparecem marcados. É derivada só da contagem
// de dias seguidos — a API não devolve o histórico dia a dia.
export function buildStreakWeek(currentStreak: number, today: Date = new Date()): StreakDay[] {
  const streak = Math.max(0, Math.floor(currentStreak));
  return Array.from({ length: 7 }, (_, index) => {
    const daysAgo = 6 - index;
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
    return {
      label: WEEKDAY_LETTERS[date.getDay()],
      done: daysAgo < streak,
      isToday: daysAgo === 0,
    };
  });
}
