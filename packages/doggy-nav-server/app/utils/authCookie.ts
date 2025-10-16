import type { Context } from 'egg';

interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

const buildCookieOptions = (ctx: Context) => {
  const options: any = {
    httpOnly: true,
    secure: ctx.secure ?? ctx.request.protocol === 'https',
    sameSite: 'lax',
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
};

export const setAuthCookies = (ctx: Context, tokens: TokenPair) => {
  const options = buildCookieOptions(ctx);
  ctx.cookies.set('access_token', tokens.accessToken, options);

  if (tokens.refreshToken) {
    ctx.cookies.set('refresh_token', tokens.refreshToken, options);
  }
};

export const clearAuthCookies = (ctx: Context) => {
  const options = buildCookieOptions(ctx);
  ctx.cookies.set('access_token', '', { ...options, maxAge: 0 });
  ctx.cookies.set('refresh_token', '', { ...options, maxAge: 0 });
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
