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

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

// Delay artificial só no modo mock, pra UI já nascer tratando estados de
// loading corretamente em vez de assumir resposta instantânea.
export const MOCK_LATENCY_MS = 400;
