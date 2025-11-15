import type { Context as HonoContext } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
  type AppSource,
  getAppSourceFromHeader,
  getCookieNames,
  type CookieEnvConfig,
  type CookieRequestMeta,
  buildCookieOptions as buildCookieOptionsCore,
} from 'doggy-nav-core';

export function getAppSource(c: HonoContext): AppSource {
  return getAppSourceFromHeader(c.req.header('X-App-Source'));
}

function buildCookieOptions(c: HonoContext, path: string = '/') {
  const env: CookieEnvConfig = {
    nodeEnv: (c.env as any)?.NODE_ENV,
    cookieDomainMode: (c.env as any)?.COOKIE_DOMAIN_MODE,
    cookieDomain: (c.env as any)?.COOKIE_DOMAIN,
    cookieDomainAllowlist: (c.env as any)?.COOKIE_DOMAIN_ALLOWLIST,
  };

  const url = c.req.url || '';
  const req: CookieRequestMeta = {
    appSourceHeader: c.req.header('X-App-Source'),
    host: c.req.header('host') || null,
    isSecure:
      (c.req.header('x-forwarded-proto') || '').toLowerCase() === 'https' ||
      url.startsWith('https://'),
  };

  return buildCookieOptionsCore(env, req, path);
}

export function setAuthCookies(
  c: HonoContext,
  tokens: { accessToken: string; refreshToken?: string }
) {
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
