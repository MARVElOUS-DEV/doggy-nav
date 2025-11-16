import type { Context } from 'hono';
import { responses } from '../utils/responses';
import {
  type RateLimitBucket,
  type RateLimitConfig,
  type RateLimitUserType,
  applyFixedWindow,
  baseRateLimitExemptPaths,
  defaultRateLimitRoutes,
  generateRateLimitKey,
  getRouteLimits,
  getUserTypeFromContext,
  isExemptPath,
} from 'doggy-nav-core';

const store: Map<string, RateLimitBucket> = new Map();

function getClientIp(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || '';
  return ip.split(',')[0].trim() || 'unknown';
}

function buildConfig(env: {
  RATE_LIMIT_ENABLED?: string;
  RATE_LIMIT_WINDOW_MS?: string | number;
  RATE_LIMIT_MAX?: string | number;
}): RateLimitConfig {
  const enabledRaw = String(env.RATE_LIMIT_ENABLED ?? '').toLowerCase();
  const enabled = enabledRaw === '' ? false : enabledRaw === 'true';
  const windowMs = Number(env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(env.RATE_LIMIT_MAX ?? 100);
  return {
    enabled,
    anonymous: { limit: max, interval: windowMs },
    authenticated: { limit: max, interval: windowMs },
    admin: { limit: max, interval: windowMs },
    routes: defaultRateLimitRoutes,
    exemptPaths: [...baseRateLimitExemptPaths, '/api/health'],
  };
}

export function rateLimit() {
  return async (c: any, next: () => Promise<void>) => {
    const path: string = c.req.path || '';
    const config = buildConfig(c.env || {});

    if (config.enabled === false) {
      return next();
    }

    if (isExemptPath(path, config.exemptPaths)) {
      return next();
    }

    const clientIp = getClientIp(c);

    const user = c.get('user') as
      | {
          id: string;
          roles?: string[];
          effectiveRoles?: string[];
        }
      | undefined;

    const userType: RateLimitUserType = getUserTypeFromContext({
      hasUser: !!user,
      roles: user?.roles,
      effectiveRoles: user?.effectiveRoles,
    });

    const limits = getRouteLimits(path, config, userType);

    const key = generateRateLimitKey({
      userType,
      userId: user?.id,
      ip: clientIp,
    });

    const now = Date.now();
    const result = applyFixedWindow(store, key, limits, now);

    c.header('X-RateLimit-Limit', String(result.limit));
    c.header('X-RateLimit-Remaining', String(result.remaining));
    c.header('X-RateLimit-Reset', String(Math.floor(result.resetTime / 1000)));

    if (!result.allowed) {
      if (result.retryAfterSeconds != null) {
        c.header('Retry-After', String(result.retryAfterSeconds));
      }
      return c.json(responses.err('Too many requests'), 429);
    }

    return next();
  };
}
