// Conversões comuns entre o formato do backend e o do app. Funções puras.

// Listas paginadas do backend chegam como { items, meta }. Aceita também uma
// lista simples (algumas rotas, como grupos, devolvem direto).
//
// LIMITAÇÃO: a forma do `meta` não foi confirmada (o Swagger não está público),
// então o app NÃO pagina: pede uma página grande (limit) e lê só `items`.
export interface Paginated<T> {
  items: T[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  total?: number;
}

export function unwrapItems<T>(data: Paginated<T> | T[] | null | undefined): T[] {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

// Decimais do banco (numeric) podem chegar como texto ("12.50").
export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

// Arredonda para 2 casas (o backend aceita até 2) e limita ao intervalo.
export function round2(value: number, min = 0, max = 9999.99): number {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(max, Math.max(min, rounded));
}
