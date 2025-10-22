import type { Context } from 'egg';

export type AppSource = 'admin' | 'main';

export function getAppSource(ctx: Context): AppSource {
  const raw = (ctx.get('X-App-Source') || '').toLowerCase();
  return raw === 'admin' ? 'admin' : 'main';
}

export function getCookieNames(src: AppSource): { access: string; refresh: string } {
  return {
    access: src === 'admin' ? 'access_token_admin' : 'access_token_main',
    refresh: src === 'admin' ? 'refresh_token_admin' : 'refresh_token_main',
  };
}

export function getAccessTokenFromCookies(ctx: Context): string | undefined {
  const src = getAppSource(ctx);
  const { access } = getCookieNames(src);
  return ctx.cookies.get(access);
}

export function getRefreshTokenFromCookies(ctx: Context): string | undefined {
  const src = getAppSource(ctx);
  const { refresh } = getCookieNames(src);
  return ctx.cookies.get(refresh);
}
