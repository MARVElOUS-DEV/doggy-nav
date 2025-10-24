import type { Context } from 'egg';
import { getAppSource, getCookieNames } from './appSource';

interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

// Compute cookie domain per request based on strategy.
// Strategies:
// - auto (default): host-only cookie (omit Domain)
// - fixed: always use COOKIE_DOMAIN
// - allowlist: use COOKIE_DOMAIN_ALLOWLIST mapping (e.g., "admin=admin.example.com,main=main.example.org")
const getCookieDomainForRequest = (ctx: Context): string | undefined => {
  const mode = String(process.env.COOKIE_DOMAIN_MODE || 'auto').toLowerCase();
  if (mode === 'fixed') {
    return process.env.COOKIE_DOMAIN || undefined;
  }
  if (mode === 'allowlist') {
    const raw = process.env.COOKIE_DOMAIN_ALLOWLIST || '';
    if (raw) {
      const map: Record<string, string> = {};
      raw
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((pair) => {
          const [k, v] = pair.split(/[:=]/).map((s) => s.trim());
          if (k && v) map[k.toLowerCase()] = v;
        });
      const src = getAppSource(ctx);
      if (map[src]) return map[src];
      const host = String((ctx.request?.header?.host || ctx.host || '')).toLowerCase();
      if (host && map[host]) return map[host];
    }
  }
  return undefined; // auto -> host-only
};

const buildCookieOptions = (ctx: Context, path: string = '/') => {
  const options: any = {
    httpOnly: true,
    // In dev with localhost over http, force secure=false so cookies persist
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
  };

  const domain = getCookieDomainForRequest(ctx);
  if (domain) options.domain = domain;

  return options;
};

export const setAuthCookies = (ctx: Context, tokens: TokenPair) => {
  const src = getAppSource(ctx);
  const { access, refresh } = getCookieNames(src);

  const accessOptions = buildCookieOptions(ctx, '/');
  ctx.cookies.set(access, tokens.accessToken, accessOptions);

  if (tokens.refreshToken) {
    const refreshOptions = buildCookieOptions(ctx, '/api/auth/refresh');
    ctx.cookies.set(refresh, tokens.refreshToken, refreshOptions);
  }
};

export const clearAuthCookies = (ctx: Context) => {
  const src = getAppSource(ctx);
  const { access, refresh } = getCookieNames(src);
  const accessOptions = buildCookieOptions(ctx, '/');
  const refreshOptions = buildCookieOptions(ctx, '/api/auth/refresh');
  ctx.cookies.set(access, '', { ...accessOptions, maxAge: 0 });
  ctx.cookies.set(refresh, '', { ...refreshOptions, maxAge: 0 });
};

export const setStateCookie = (ctx: Context, state: string) => {
  const options = buildCookieOptions(ctx);
  ctx.cookies.set('oauth_state', state, options);
};

export const getStateCookie = (ctx: Context) => ctx.cookies.get('oauth_state');

export const clearStateCookie = (ctx: Context) => {
  const options = buildCookieOptions(ctx);
  ctx.cookies.set('oauth_state', '', { ...options, maxAge: 0 });
};
