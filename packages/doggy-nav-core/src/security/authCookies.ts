export type AppSource = 'admin' | 'main';

export function getAppSourceFromHeader(headerValue?: string | null): AppSource {
  const raw = (headerValue || '').toLowerCase();
  return raw === 'admin' ? 'admin' : 'main';
}

export function getCookieNames(src: AppSource): { access: string; refresh: string } {
  return {
    access: src === 'admin' ? 'access_token_admin' : 'access_token_main',
    refresh: src === 'admin' ? 'refresh_token_admin' : 'refresh_token_main',
  };
}

export interface CookieEnvConfig {
  /** NODE_ENV value (e.g. "development" | "production") */
  nodeEnv?: string | null;
  /** COOKIE_DOMAIN_MODE: auto | fixed | allowlist */
  cookieDomainMode?: string | null;
  /** COOKIE_DOMAIN used when mode=fixed */
  cookieDomain?: string | null;
  /** COOKIE_DOMAIN_ALLOWLIST mapping string */
  cookieDomainAllowlist?: string | null;
}

export interface CookieRequestMeta {
  /** Raw X-App-Source header value */
  appSourceHeader?: string | null;
  /** Host header value */
  host?: string | null;
  /** Whether the effective request is over HTTPS */
  isSecure?: boolean;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none' | 'Lax' | 'Strict' | 'None';
  path?: string;
  domain?: string;
  maxAge?: number;
}

function parseAllowlist(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [k, v] = pair.split(/[:=]/).map((s) => s.trim());
      if (k && v) map[k.toLowerCase()] = v;
    });
  return map;
}

export function getCookieDomainForRequest(
  env: CookieEnvConfig,
  req: CookieRequestMeta
): string | undefined {
  const mode = String(env.cookieDomainMode || 'auto').toLowerCase();
  if (mode === 'fixed') {
    return env.cookieDomain || undefined;
  }

  if (mode === 'allowlist') {
    const raw = env.cookieDomainAllowlist || '';
    if (raw) {
      const map = parseAllowlist(raw);
      const src = getAppSourceFromHeader(req.appSourceHeader);
      if (map[src]) return map[src];

      const host = (req.host || '').toLowerCase();
      if (host && map[host]) return map[host];
    }
  }

  // auto -> host-only (omit Domain)
  return undefined;
}

export function buildCookieOptions(
  env: CookieEnvConfig,
  req: CookieRequestMeta,
  path: string = '/'
): CookieOptions {
  const nodeEnv = (env.nodeEnv || '').toLowerCase();
  const isProd = nodeEnv === 'production';

  // Only mark cookies secure when the effective request is HTTPS.
  const secure = isProd ? !!req.isSecure : false;

  const domain = getCookieDomainForRequest(env, req);

  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path,
  };

  if (domain) options.domain = domain;

  return options;
}
