/**
 * Ponto único de decisão: mock ou API real.
 * Controlado por EXPO_PUBLIC_USE_MOCK no .env (ver .env.example).
 *
 * Quando o backend NestJS estiver rodando, basta mudar essa variável
 * para 'false' e preencher EXPO_PUBLIC_API_URL — nenhum código de tela
 * ou de query precisa mudar, porque tanto o client mock quanto o axios
 * implementam a mesma interface (ver api/client.ts).
 */
export const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== 'false';

// Permite integrar autenticação com o backend real enquanto os demais
// domínios, ainda não implementados no backend, continuam usando mocks.
export const USE_AUTH_MOCK =
  process.env.EXPO_PUBLIC_USE_AUTH_MOCK === undefined
    ? USE_MOCK
    : process.env.EXPO_PUBLIC_USE_AUTH_MOCK !== 'false';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

if ((!USE_MOCK || !USE_AUTH_MOCK) && !configuredApiUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL é obrigatória quando a API real está habilitada.',
  );
}

export const API_BASE_URL = configuredApiUrl ?? '';

// Delay artificial só no modo mock, pra UI já nascer tratando estados de
// loading corretamente em vez de assumir resposta instantânea.
export const MOCK_LATENCY_MS = 400;

// Abas do app que ainda mostram a MaintenanceScreen no lugar da tela real
// (apresentação). Lista separada por vírgula em EXPO_PUBLIC_MAINTENANCE_TABS,
// com os nomes: home, meals, group. Vazia ("") = nenhuma aba em manutenção.
// Sem a variável, vale o padrão abaixo: Início e Refeições já são reais, só
// Grupo segue em manutenção até a tela ficar pronta. A aba Perfil nunca
// entra aqui.
export type MaintenanceTab = 'home' | 'meals' | 'group';

const MAINTENANCE_TAB_NAMES: readonly MaintenanceTab[] = ['home', 'meals', 'group'];
const DEFAULT_MAINTENANCE_TABS: readonly MaintenanceTab[] = ['group'];

export function parseMaintenanceTabs(raw: string | undefined): ReadonlySet<MaintenanceTab> {
  if (raw === undefined) return new Set(DEFAULT_MAINTENANCE_TABS);

  const requested = raw.split(',').map((name) => name.trim().toLowerCase());
  return new Set(MAINTENANCE_TAB_NAMES.filter((name) => requested.includes(name)));
}

export const MAINTENANCE_TABS = parseMaintenanceTabs(process.env.EXPO_PUBLIC_MAINTENANCE_TABS);

// URL da landing page oficial, aberta pelo botão da MaintenanceScreen.
export const LANDING_PAGE_URL = process.env.EXPO_PUBLIC_LANDING_PAGE_URL ?? '';
