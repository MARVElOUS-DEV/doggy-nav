import { getRoutePermission, hasAccess } from '../access-control';
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

    // 3.client secret
    const clientSecretOk = await clientSecretGuard(ctx, url);
    if (!clientSecretOk) return; // response already sent

    // 4.access modes
    if (permission.require?.level === 'public') return await next();
    if (permission.require?.level === 'optional') {
      // In admin source, treat optional as authenticated + admin/sysadmin role
      if (ctx.state.requestSource === 'admin') {
        const authResult = await authenticateWithRefresh(ctx);
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
      await authenticateWithRefresh(ctx); // best-effort for main
      return await next();
    }

    // 5.authenticated/admin
    const authResult = await authenticateWithRefresh(ctx);
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

async function clientSecretGuard(ctx: any, url: string) {
  const cfg = ctx?.app?.config?.clientSecret || {};
  const required = Boolean(cfg.requireForAllAPIs);
  const bypass: string[] = Array.isArray(cfg.bypassRoutes) ? cfg.bypassRoutes : [];
  if (!required) return true;
  const isBypass = matchesBypass(url, bypass);
  if (isBypass) return true;

  const headerName = (cfg as any).headerName || 'x-client-secret';
  const clientSecret = ctx.headers[headerName];
  if (!clientSecret) return (respond(ctx, 401, '请提供客户端密钥'), false);
  try {
    const isValid = await ctx.service.clientSecret.verifyClientSecret(clientSecret);
    if (!isValid) return (respond(ctx, 401, '无效的客户端密钥'), false);
    const appInfo = await ctx.service.clientSecret.getApplicationByClientSecret(clientSecret);
    if (appInfo) {
      ctx.state.clientApplication = {
        id: appInfo._id?.toString?.() ?? appInfo.id,
        name: appInfo.name,
        authType: 'client_secret',
      };
    }
    return true;
  } catch (e) {
    ctx.logger.error('Client secret verification error:', e);
    return (respond(ctx, 500, '客户端密钥验证失败'), false);
  }
}

function matchesBypass(url: string, routes: string[]) {
  return routes.some((route) => {
    if (route === url) return true;
    const r = route.split('/');
    const u = url.split('/');
    if (r.length !== u.length) return false;
    return r.every((part, i) => part.startsWith(':') || part === u[i]);
  });
}

async function authenticateWithRefresh(ctx: any) {
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

  // Do not auto-refresh here anymore; use explicit /api/auth/refresh endpoint
  return { authenticated: false, error: token ? 'token失效或解析错误' : '未提供认证信息' };
}
