import { MAX_MESSAGE_LENGTH } from '@/utils/chat';

export const INVITE_CODE_LENGTH = 8;

// O código de convite tem 8 caracteres A-Z e 0-9, sempre em maiúsculas.
export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, INVITE_CODE_LENGTH);
}

export function validateInviteCode(raw: string): string | null {
  const code = raw.trim().toUpperCase();
  if (!code) return 'Informe o código de convite.';
  if (!/^[A-Z0-9]{8}$/.test(code)) {
    return `O código tem ${INVITE_CODE_LENGTH} caracteres, só letras e números.`;
  }
  return null;
}

// Mensagem do chat: de 1 a 2000 caracteres (depois de tirar os espaços das pontas).
export function validateMessage(raw: string): string | null {
  const content = raw.trim();
  if (!content) return 'Escreva uma mensagem.';
  if (content.length > MAX_MESSAGE_LENGTH) {
    return `A mensagem pode ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`;
  }
  return null;
}

export function canSendMessage(raw: string): boolean {
  return validateMessage(raw) === null;
}
