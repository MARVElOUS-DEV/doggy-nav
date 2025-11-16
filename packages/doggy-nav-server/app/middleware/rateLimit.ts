import { Context } from 'egg';
import {
  type RateLimitBucket,
  type RateLimitConfig,
  type RateLimitUserType,
  applyFixedWindow,
  generateRateLimitKey,
  getRouteLimits,
  getUserTypeFromContext,
  isExemptPath,
  isIpBlacklisted,
  isIpWhitelisted,
} from 'doggy-nav-core';

const rateLimitStore = new Map<string, RateLimitBucket>();

export default function rateLimitMiddleware() {
  return async (ctx: Context, next: () => Promise<any>) => {
    const config = ctx.app.config.rateLimit as RateLimitConfig | undefined;
    if (!config || config.enabled === false) return await next();

    const path = ctx.path;

    if (isExemptPath(path, config.exemptPaths)) {
      return await next();
    }

    const clientIp = getClientIp(ctx);

    if (isIpBlacklisted(clientIp, config.blacklist)) {
      ctx.status = 429;
      ctx.body = {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      };
      return;
    }

    if (isIpWhitelisted(clientIp, config.whitelist)) {
      return await next();
    }

    const userinfo = (ctx.state as any).userinfo;
    const userType: RateLimitUserType = getUserTypeFromContext({
      hasUser: !!userinfo,
      roles: userinfo?.roles,
      effectiveRoles: userinfo?.effectiveRoles,
    });

    const limits = getRouteLimits(path, config, userType);

    const key = generateRateLimitKey({
      userType,
      userId: userinfo?.userId || userinfo?.id,
      ip: clientIp,
    });

    const now = Date.now();
    const result = applyFixedWindow(rateLimitStore, key, limits, now);

    ctx.set('X-RateLimit-Limit', String(result.limit));
    ctx.set('X-RateLimit-Remaining', String(result.remaining));
    ctx.set('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)));

    if (!result.allowed) {
      const retryAfter = result.retryAfterSeconds ?? Math.ceil((result.resetTime - now) / 1000);
      ctx.set('Retry-After', String(retryAfter));
      ctx.status = 429;
      ctx.body = {
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      };
      ctx.logger.warn(
        '[rateLimit] blocked request %s %s (key=%s, type=%s, limit=%d, interval=%d, ip=%s)',
        ctx.method,
        ctx.path,
        key,
        userType,
        limits.limit,
        limits.interval,
        clientIp
      );
      return;
    }

    await next();
  };
}

function getClientIp(ctx: Context): string {
  const header = ctx.get('x-forwarded-for');
  if (header) {
    const first = header.split(',')[0].trim();
    if (first) return first;
  }
  return ctx.ip;
}
