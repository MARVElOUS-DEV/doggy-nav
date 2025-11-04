import type { Context as HonoContext } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

type AppSource = 'admin' | 'main';

export function getAppSource(c: HonoContext): AppSource {
  const raw = (c.req.header('X-App-Source') || '').toLowerCase();
  return raw === 'admin' ? 'admin' : 'main';
}

export function getCookieNames(src: AppSource): { access: string; refresh: string } {
  return {
    access: src === 'admin' ? 'access_token_admin' : 'access_token_main',
    refresh: src === 'admin' ? 'refresh_token_admin' : 'refresh_token_main',
  };
}

function getCookieDomainForRequest(c: HonoContext): string | undefined {
  const mode = String((c.env as any)?.COOKIE_DOMAIN_MODE || 'auto').toLowerCase();
  if (mode === 'fixed') {
    return (c.env as any)?.COOKIE_DOMAIN || undefined;
  }
  if (mode === 'allowlist') {
    const raw = (c.env as any)?.COOKIE_DOMAIN_ALLOWLIST || '';
    if (raw) {
      const map: Record<string, string> = {};
      (raw
        .split(/[;,]/)
        .map((s: string) => s.trim())
        .filter(Boolean) as string[])
        .forEach((pair: string) => {
          const [k, v] = pair.split(/[:=]/).map((s: string) => s.trim());
          if (k && v) map[k.toLowerCase()] = v;
        });
      const src = getAppSource(c);
      if (map[src]) return map[src];
      const host = String(c.req.header('host') || '').toLowerCase();
      if (host && map[host]) return map[host];
    }
  }
  return undefined; // auto: host-only cookie
}

function buildCookieOptions(c: HonoContext, path: string = '/') {
  const options: any = {
    httpOnly: true,
    secure: String((c.env as any)?.NODE_ENV || '').toLowerCase() === 'production',
    sameSite: 'Lax',
    path,
  };
  const domain = getCookieDomainForRequest(c);
  if (domain) options.domain = domain;
  return options;
}

export function setAuthCookies(c: HonoContext, tokens: { accessToken: string; refreshToken?: string }) {
  const src = getAppSource(c);
  const { access, refresh } = getCookieNames(src);
  const accessOptions = buildCookieOptions(c, '/');
  setCookie(c, access, tokens.accessToken, accessOptions);
  if (tokens.refreshToken) {
    const refreshOptions = buildCookieOptions(c, '/api/auth/refresh');
    setCookie(c, refresh, tokens.refreshToken, refreshOptions);
  }
}

export function clearAuthCookies(c: HonoContext) {
  const src = getAppSource(c);
  const { access, refresh } = getCookieNames(src);
  const accessOptions = buildCookieOptions(c, '/');
  const refreshOptions = buildCookieOptions(c, '/api/auth/refresh');
  deleteCookie(c, access, { ...accessOptions, maxAge: 0 });
  deleteCookie(c, refresh, { ...refreshOptions, maxAge: 0 });
}

export function getAccessTokenFromCookies(c: HonoContext): string | undefined {
  const src = getAppSource(c);
  const { access } = getCookieNames(src);
  return getCookie(c, access);
}

export function getRefreshTokenFromCookies(c: HonoContext): string | undefined {
  const src = getAppSource(c);
  const { refresh } = getCookieNames(src);
  return getCookie(c, refresh);
}

// OAuth state cookie helpers (mirrors server behavior)
export function setStateCookie(c: HonoContext, state: string) {
  const options = buildCookieOptions(c, '/');
  setCookie(c, 'oauth_state', state, options);
}

export function getStateCookie(c: HonoContext): string | undefined {
  return getCookie(c, 'oauth_state');
}

export function clearStateCookie(c: HonoContext) {
  const options = buildCookieOptions(c, '/');
  deleteCookie(c, 'oauth_state', { ...options, maxAge: 0 });
}
