// Estado mutável só do modo mock (USE_AUTH_MOCK) — simula o que o backend
// real faz: marcar o onboarding como pendente logo após um cadastro novo, e
// como concluído quando o wizard é enviado. Sem isso, getMyProfile() sempre
// devolvia o mockUserProfile estático (que já vem com
// onboardingCompleted: true), pulando o onboarding mesmo logo depois de um
// cadastro novo.
//
// Começa em `true` pra não forçar onboarding numa sessão já autenticada
// que reabre o app (bootstrap) — só um cadastro novo reseta pra `false`.
let onboardingCompleted = true;

export function getMockOnboardingCompleted(): boolean {
  return onboardingCompleted;
}

export function setMockOnboardingCompleted(value: boolean): void {
  onboardingCompleted = value;
}
