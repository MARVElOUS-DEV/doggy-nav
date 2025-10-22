import type { Context } from 'egg';
import { getAppSource, getCookieNames } from './appSource';

interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

const buildCookieOptions = (_ctx: Context, path: string = '/') => {
  const options: any = {
    httpOnly: true,
    // In dev with localhost over http, force secure=false so cookies persist
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path,
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

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
