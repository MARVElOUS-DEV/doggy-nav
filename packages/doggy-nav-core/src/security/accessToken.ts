export interface VerifiedAccessToken {
  userId: string;
  roles: string[];
  exp: number;
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid JWT encoding');
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Verify access JWTs in runtimes that only expose Web Crypto (e.g. the image Worker). */
export async function verifyHs256AccessToken(
  token: string,
  secret: string
): Promise<VerifiedAccessToken | null> {
  try {
    if (!secret) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, signaturePart] = parts;
    const decoder = new TextDecoder();
    const header = JSON.parse(decoder.decode(decodeBase64Url(headerPart)));
    if (header.alg !== 'HS256' || header.crit !== undefined) return null;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(decodeBase64Url(payloadPart)));
    const now = Math.floor(Date.now() / 1000);
    if (
      payload.typ !== 'access' ||
      typeof payload.userId !== 'string' ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(payload.userId) ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now ||
      (payload.nbf !== undefined &&
        (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > now))
    )
      return null;
    return {
      userId: payload.userId,
      exp: payload.exp,
      roles: Array.isArray(payload.roles)
        ? payload.roles.filter((r: unknown) => typeof r === 'string')
        : [],
    };
  } catch {
    return null;
  }
}
