import { getRoutePermission, hasAccess, enforceClientSecret, type ClientSecretGuardConfig } from 'doggy-nav-core';
import { getAccessTokenFromCookies, getAppSource } from '../utils/appSource';
import { computeEffectiveRoles } from '../utils/rbac';
import type { AuthUserContext } from '../../types/rbac';

export default () => {
  return async function (ctx: any, next: any) {
    // Allow CORS preflight without auth/permission checks
    if (ctx.method === 'OPTIONS') return await next();
    const url = normalizePath(ctx.url);

    // 1.Validate request source header strictly
    const hdrRaw = ctx.get('X-App-Source');
    if (!hdrRaw) return respond(ctx, 400, 'malformed request');
    const hdr = String(hdrRaw).trim().toLowerCase();
    if (hdr !== 'main' && hdr !== 'admin') {
      return respond(ctx, 400, 'malformed request');
    }
    ctx.state.requestSource = hdr;

    // 2.permission
    const permission = getRoutePermission(ctx.method, url);
    if (!permission) return respond(ctx, 403, '访问被拒绝：未配置权限');

    // 3.client secret (shared core guard)
    const cfg: ClientSecretGuardConfig = {
      requireForAllAPIs: Boolean(ctx?.app?.config?.clientSecret?.requireForAllAPIs),
      bypassRoutes: Array.isArray(ctx?.app?.config?.clientSecret?.bypassRoutes)
        ? ctx.app.config.clientSecret.bypassRoutes
        : [],
      headerName: ctx?.app?.config?.clientSecret?.headerName || 'x-client-secret',
    };
    const headers: Record<string, string | undefined> = { ...ctx.headers };
    const res = await enforceClientSecret({
      url,
      headers,
      config: cfg,
      validate: async (secret) => {
        const valid = await ctx.service.clientSecret.verifyClientSecret(secret);
        if (!valid) return { valid };
        const appInfo = await ctx.service.clientSecret.getApplicationByClientSecret(secret);
        if (appInfo) return { valid: true, app: { id: appInfo._id?.toString?.() ?? appInfo.id, name: appInfo.name } };
        return { valid: true };
      },
    });
    if (!res.ok) return respond(ctx, (res as any).code, (res as any).message);
    if (res.appInfo) {
      ctx.state.clientApplication = res.appInfo;
    }

    // 4.access modes
    if (permission.require?.level === 'public') return await next();
    if (permission.require?.level === 'optional') {
      // In admin source, treat optional as authenticated + admin/sysadmin role
      if (ctx.state.requestSource === 'admin') {
        const authResult = await accessTokenVerify(ctx);
        if (!authResult.authenticated) return respond(ctx, 401, authResult.error || '需要身份验证');
        const user = ctx.state.userinfo as AuthUserContext | undefined;
        const eff =
          Array.isArray(user?.effectiveRoles) && user!.effectiveRoles!.length
            ? user!.effectiveRoles!
            : Array.isArray(user?.roles)
              ? user!.roles!
              : [];
        if (!(eff.includes('admin') || eff.includes('sysadmin'))) {
          return respond(ctx, 403, '权限不足');
        }
        return await next();
      }
      await accessTokenVerify(ctx);
      return await next();
    }

    // 5.authenticated/admin
    const authResult = await accessTokenVerify(ctx);
    if (!hasAccess(permission, ctx.state.userinfo as AuthUserContext | undefined)) {
      if (authResult.authenticated) return respond(ctx, 403, '权限不足');
      return respond(ctx, 401, authResult.error || '需要身份验证');
    }

    await next();
  };
};

function normalizePath(original: string) {
  const i = original.indexOf('?');
  return i >= 0 ? original.slice(0, i) : original;
}

function respond(ctx: any, status: number, msg: string) {
  ctx.status = status;
  ctx.body = { code: status, msg, data: null };
}

// client secret guard logic moved to doggy-nav-core/security/clientSecretGuard

async function accessTokenVerify(ctx: any) {
  const bearer = ctx.headers.authorization ? ctx.headers.authorization : '';
  let token: string | null = null;
  if (bearer && bearer.startsWith('Bearer ')) token = bearer.substring(7);
  if (!token) {
    const cookieToken = getAccessTokenFromCookies(ctx);
    if (cookieToken)
      token = cookieToken.startsWith('Bearer ') ? cookieToken.substring(7) : cookieToken;
  }

  const jwt = ctx?.app?.jwt;
  const secret = ctx?.app?.config?.jwt?.secret;
  if (!jwt || !secret) return { authenticated: false, error: 'JWT not available' };

  if (token) {
    try {
      const decode: any = await jwt.verify(token, secret);
      // Attach request source and effective roles
      const source = getAppSource(ctx);
      const eff = computeEffectiveRoles(Array.isArray(decode?.roles) ? decode.roles : [], source);
      ctx.state.userinfo = {
        ...decode,
        authType: 'jwt',
        source,
        effectiveRoles: eff,
      } as AuthUserContext;
      return { authenticated: true };
    } catch (err) {
      ctx.logger.debug('JWT auth (access) error:', err);
    }
  }
  return { authenticated: false, error: token ? 'token失效或解析错误' : '未提供认证信息' };
}
