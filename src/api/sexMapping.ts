import type { BiologicalSex } from './types/domain';

// ÚNICO lugar que liga o valor usado no app ao valor enviado/recebido pelo
// backend no campo `biologicalSex`. Hoje são iguais; se o backend usar outro
// nome para "prefiro não informar" (ex.: 'UNSPECIFIED'), troque só aqui.
const APP_TO_API: Record<BiologicalSex, string> = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
  PREFER_NOT_TO_SAY: 'PREFER_NOT_TO_SAY',
};

export function toApiSex(sex: BiologicalSex): string {
  return APP_TO_API[sex];
}

// Valor desconhecido (ou ausente) vira null: o usuário escolhe de novo.
export function fromApiSex(value: string | null | undefined): BiologicalSex | null {
  const entry = (Object.entries(APP_TO_API) as [BiologicalSex, string][]).find(
    ([, apiValue]) => apiValue === value,
  );
  return entry ? entry[0] : null;
}
