export class UnsafePublicUrlError extends Error {
  constructor() {
    super('Only public HTTP(S) URLs are allowed');
    this.name = 'UnsafePublicUrlError';
  }
}

/** Fail closed for special-purpose IP space, including IPv4 embedded in IPv6. */
export function isPublicIp(address: string): boolean {
  if (address.includes(':')) {
    let host: string;
    try {
      host = new URL(`http://[${address.replace(/^\[|\]$/g, '')}]/`).hostname.slice(1, -1);
    } catch {
      return false;
    }
    // Only ordinary global-unicast IPv6; excludes mapped IPv4, NAT64, ULA and link-local.
    const first = parseInt(host.split(':')[0], 16);
    if (!Number.isFinite(first) || first < 0x2000 || first > 0x3fff) return false;
    const second = parseInt(host.split(':')[1] || '0', 16);
    if (first === 0x2001 && (second < 0x200 || second === 0xdb8)) return false;
    if (first === 0x2002 || (first === 0x3fff && second < 0x1000)) return false;
    return true;
  }
  const parts = address.split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
    return false;
  }
  const [a, b, c] = parts.map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)) || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

export function assertPublicHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafePublicUrlError();
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new UnsafePublicUrlError();
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const ip = hostname.replace(/^\[|\]$/g, '');
  if (hostname.includes(':') || /^[\d.]+$/.test(hostname)) {
    if (!isPublicIp(ip)) throw new UnsafePublicUrlError();
  } else if (
    !hostname.includes('.') ||
    /(?:^|\.)(?:localhost|local|internal|home|lan|test|invalid)$/.test(hostname)
  ) {
    throw new UnsafePublicUrlError();
  }
  return url;
}

export interface PublicHttpOptions {
  method?: 'GET' | 'HEAD';
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxBytes?: number;
  allowUrl?: (url: URL) => boolean;
}

export interface PublicHttpResponse {
  status: number;
  body: string;
  location?: string;
}

export type PublicHttpTransport = (
  url: URL,
  options: Required<Pick<PublicHttpOptions, 'method' | 'timeoutMs' | 'maxBytes'>> &
    PublicHttpOptions
) => Promise<PublicHttpResponse>;

/** Every redirect goes through the same URL and transport-level DNS checks. */
export async function requestPublicHttp(
  input: string,
  transport: PublicHttpTransport,
  options: PublicHttpOptions = {}
): Promise<PublicHttpResponse> {
  const deadline = Date.now() + (options.timeoutMs ?? 5000);
  let url = assertPublicHttpUrl(input);
  for (let redirects = 0; redirects <= 5; redirects++) {
    if (options.allowUrl && !options.allowUrl(url)) throw new UnsafePublicUrlError();
    const timeoutMs = deadline - Date.now();
    if (timeoutMs <= 0) throw new Error('Public HTTP request timed out');
    const response = await transport(url, {
      ...options,
      method: options.method ?? 'GET',
      maxBytes: options.maxBytes ?? 2 * 1024 * 1024,
      timeoutMs,
    });
    if (![301, 302, 303, 307, 308].includes(response.status) || !response.location) return response;
    url = assertPublicHttpUrl(new URL(response.location, url).href);
  }
  throw new Error('Too many redirects');
}
