// Prefixo da versão da API, num só lugar. EXPO_PUBLIC_API_URL fica SEM /v1 no
// fim; toda rota do app passa por v1(). (Auth e users escrevem o /v1 na mão
// desde a primeira integração e seguem iguais.)
export const API_PREFIX = '/v1';

export function v1(path: string): string {
  return `${API_PREFIX}${path.startsWith('/') ? path : `/${path}`}`;
}
