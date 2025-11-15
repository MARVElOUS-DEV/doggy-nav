import type { Context } from 'egg';
import { getAppSource, getCookieNames } from './appSource';
import {
  buildCookieOptions as buildCookieOptionsCore,
  type CookieEnvConfig,
  type CookieRequestMeta,
} from 'doggy-nav-core';

interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

const buildCookieOptions = (ctx: Context, path: string = '/') => {
  const env: CookieEnvConfig = {
    nodeEnv: process.env.NODE_ENV,
    cookieDomainMode: process.env.COOKIE_DOMAIN_MODE,
    cookieDomain: process.env.COOKIE_DOMAIN,
    cookieDomainAllowlist: process.env.COOKIE_DOMAIN_ALLOWLIST,
  };

  const req: CookieRequestMeta = {
    appSourceHeader: ctx.get('X-App-Source'),
    host: (ctx.request?.header?.host || ctx.host || '') as string,
    isSecure: Boolean((ctx as any).secure),
  };

  return buildCookieOptionsCore(env, req, path);
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
