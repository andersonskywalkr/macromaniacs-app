import type { BiologicalSex } from './types/domain';

// ÚNICO lugar que liga o valor usado no app ao valor enviado/recebido pelo
// backend no campo `biologicalSex`. O backend aceita FEMALE, MALE e
// NOT_INFORMED; "Prefiro não informar" é PREFER_NOT_TO_SAY dentro do app.
const APP_TO_API: Record<BiologicalSex, string> = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
  PREFER_NOT_TO_SAY: 'NOT_INFORMED',
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
