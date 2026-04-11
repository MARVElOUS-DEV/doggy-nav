export const TOOL_OUTPUT_PUBLICATION_TOKEN_QUERY_PARAM = 'token';

function bytesToBase64Url(bytes: Uint8Array) {
  const bufferCtor = (globalThis as any).Buffer;
  if (bufferCtor) {
    return bufferCtor.from(bytes).toString('base64url');
  }

  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function generateToolOutputSubscriptionToken(byteLength = 24) {
  const cryptoApi = (globalThis as any).crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure random generator is not available');
  }

  const bytes = new Uint8Array(byteLength);
  cryptoApi.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function parsePublishedToolOutputToken(tokenValue?: string | null) {
  const token = String(tokenValue || '').trim();
  return token || null;
}

export function secureCompareText(left?: string | null, right?: string | null) {
  const a = String(left || '');
  const b = String(right || '');
  if (!a || !b || a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
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
