// "Hoje" do app, sempre no fuso do usuário. É o ÚNICO lugar que define a data
// de hoje: consumo do dia, lista de refeições do dia, sequência e Home.

export const FALLBACK_TIMEZONE = 'America/Sao_Paulo';

// Fuso do aparelho (nome IANA). Cai em America/Sao_Paulo se o engine JS não
// informar.
export function getDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

// Fuso do perfil, se existir; senão o do aparelho.
export function resolveTimezone(profileTimezone?: string | null): string {
  return profileTimezone?.trim() ? profileTimezone.trim() : getDeviceTimezone();
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

// Data (AAAA-MM-DD) do instante `now` no fuso informado. Às 23h30 em São Paulo
// já é o dia seguinte em UTC: aqui vale o dia de São Paulo.
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const pick = (type: string) => parts.find((part) => part.type === type)?.value;
    const year = pick('year');
    const month = pick('month');
    const day = pick('day');
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // fuso inválido: usa a data do aparelho abaixo
  }
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// A data de hoje no fuso, como Date local à meia-noite — para telas que
// precisam de dia da semana e rótulos (Home e sequência).
export function todayAsLocalDate(timezone: string, now: Date = new Date()): Date {
  const [year, month, day] = todayInTimezone(timezone, now).split('-').map(Number);
  return new Date(year, month - 1, day);
}
