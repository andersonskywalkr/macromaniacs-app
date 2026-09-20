type UnauthorizedHandler = () => Promise<void> | void;

let accessToken: string | null = null;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function getApiAccessToken(): string | null {
  return accessToken;
}

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

export function setApiUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler;
}

export async function handleApiUnauthorized(): Promise<void> {
  await unauthorizedHandler?.();
}
