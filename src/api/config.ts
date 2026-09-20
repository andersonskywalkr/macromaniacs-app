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
