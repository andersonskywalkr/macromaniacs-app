import {
  canSendMessage,
  normalizeInviteCode,
  validateInviteCode,
  validateMessage,
} from './groups';

describe('invite code', () => {
  it('is normalized to 8 uppercase letters and digits', () => {
    expect(normalizeInviteCode('corrida7')).toBe('CORRIDA7');
    expect(normalizeInviteCode(' ab-cd 12 34 56')).toBe('ABCD1234');
    expect(normalizeInviteCode('')).toBe('');
  });

  it('validates the format', () => {
    expect(validateInviteCode('CORRIDA7')).toBeNull();
    expect(validateInviteCode(' corrida7 ')).toBeNull();
    expect(validateInviteCode('')).toMatch(/Informe/);
    expect(validateInviteCode('ABC')).toMatch(/8 caracteres/);
    expect(validateInviteCode('ABCD123!')).toMatch(/8 caracteres/);
  });
});

describe('chat message', () => {
  it('needs text and at most 2000 characters', () => {
    expect(validateMessage('Oi')).toBeNull();
    expect(validateMessage('   ')).toMatch(/Escreva/);
    expect(validateMessage('a'.repeat(2000))).toBeNull();
    expect(validateMessage('a'.repeat(2001))).toMatch(/2000/);
  });

  it('keeps the send button disabled for an empty field', () => {
    expect(canSendMessage('')).toBe(false);
    expect(canSendMessage('  ')).toBe(false);
    expect(canSendMessage('oi')).toBe(true);
  });
});
