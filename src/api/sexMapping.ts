import type { BiologicalSex } from './types/domain';

// ÚNICO lugar que liga o valor usado no app ao valor enviado/recebido pelo
// backend no campo `biologicalSex`. O app só envia FEMALE ou MALE: as fórmulas
// de TMB, TDEE e meta do backend dependem disso, e com NOT_INFORMED ele devolve
// `nutrition: null`.
const APP_TO_API: Record<BiologicalSex, 'FEMALE' | 'MALE'> = {
  FEMALE: 'FEMALE',
  MALE: 'MALE',
};

export function toApiSex(sex: BiologicalSex): 'FEMALE' | 'MALE' {
  return APP_TO_API[sex];
}

// SÓ LEITURA. Conta criada antes desta regra pode vir do backend com
// NOT_INFORMED (ou sem sexo): isso vira null — "perfil sem sexo", que o app
// pede para completar. Qualquer valor desconhecido também vira null.
export function fromApiSex(value: string | null | undefined): BiologicalSex | null {
  return value === 'FEMALE' || value === 'MALE' ? value : null;
}
