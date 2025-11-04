import type { Context } from 'hono';
import { responses } from '../utils/responses';

type StoreEntry = { count: number; resetAt: number };
const store: Map<string, StoreEntry> = new Map();

function getClientIp(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || '';
  return ip.split(',')[0].trim() || 'unknown';
}

export function rateLimit() {
  return async (c: any, next: () => Promise<void>) => {
    // Exempt health checks
    const path = c.req.path || '';
    if (path === '/api/health') return next();

    const windowMs = Number(c.env.RATE_LIMIT_WINDOW_MS || 60_000);
    const max = Number(c.env.RATE_LIMIT_MAX || 100);

    const key = getClientIp(c);
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(max - 1));
      c.header('X-RateLimit-Reset', String(Math.floor((now + windowMs) / 1000)));
      return next();
    }

    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    c.header('X-RateLimit-Limit', String(max));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json(responses.err('Too many requests'), 429);
    }

    return next();
  };
}
