import type { Context } from 'egg';
import {
  type AppSource,
  getAppSourceFromHeader,
  getCookieNames as coreGetCookieNames,
} from 'doggy-nav-core';

export type { AppSource };

export function getAppSource(ctx: Context): AppSource {
  return getAppSourceFromHeader(ctx.get('X-App-Source'));
}

export function getCookieNames(src: AppSource): { access: string; refresh: string } {
  return coreGetCookieNames(src);
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
