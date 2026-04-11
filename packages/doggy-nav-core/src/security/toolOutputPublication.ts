export const TOOL_OUTPUT_PUBLICATION_BASIC_AUTH_REALM = 'Doggy Nav Tool Output';

export function parseBasicAuthHeader(
  headerValue?: string | null
): { username: string; password: string } | null {
  const raw = String(headerValue || '');
  if (!raw.startsWith('Basic ')) return null;

  try {
    const bufferCtor = (globalThis as any).Buffer;
    const decoded = bufferCtor
      ? bufferCtor.from(raw.slice(6), 'base64').toString('utf8')
      : atob(raw.slice(6));
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function buildBasicAuthChallengeHeader(
  realm: string = TOOL_OUTPUT_PUBLICATION_BASIC_AUTH_REALM
) {
  return `Basic realm="${realm}", charset="UTF-8"`;
}

export function isHttpsLikeRequest(input: {
  secure?: boolean;
  forwardedProto?: string | null;
  url?: string | null;
}) {
  if (input.secure) return true;

  const forwardedProto = String(input.forwardedProto || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)[0];
  if (forwardedProto) return forwardedProto === 'https';

  if (input.url) {
    try {
      return new URL(input.url).protocol === 'https:';
    } catch {
      return false;
    }
  }

  return false;
}
