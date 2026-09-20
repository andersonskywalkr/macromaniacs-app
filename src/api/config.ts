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

// Flag temporária pra apresentação: mostra a MaintenanceScreen no lugar do
// AppTabs de verdade depois do login/onboarding, já que Home/Refeições/
// Grupo/Perfil ainda são telas com dado mock (ver README). Desligar
// setando EXPO_PUBLIC_SHOW_MAINTENANCE_SCREEN=false no .env quando o app
// estiver pronto pra mostrar as telas reais.
export const SHOW_MAINTENANCE_SCREEN = process.env.EXPO_PUBLIC_SHOW_MAINTENANCE_SCREEN !== 'false';

// URL da landing page oficial, aberta pelo botão da MaintenanceScreen.
export const LANDING_PAGE_URL = process.env.EXPO_PUBLIC_LANDING_PAGE_URL ?? '';
