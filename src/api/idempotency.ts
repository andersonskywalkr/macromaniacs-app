export function createIdempotencyKey(prefix: string, userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 14);
  return `${prefix}:${userId}:${timestamp}:${random}`.slice(0, 128);
}
