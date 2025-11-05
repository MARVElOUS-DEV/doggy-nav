import type { Context } from 'hono';
import { createAuthMiddleware } from './auth';

function isAuthPublicPath(path: string, method: string): boolean {
  const p = path.split('?')[0];
  if (p === '/api/health' && method.toUpperCase() === 'GET') return true;
  if (!p.startsWith('/api/auth')) return false;
  const m = method.toUpperCase();
  if (
    m === 'POST' &&
    (p === '/api/auth/login' ||
      p === '/api/auth/register' ||
      p === '/api/auth/refresh' ||
      p === '/api/auth/logout')
  ) {
    return true;
  }
  if (m === 'GET') {
    if (p === '/api/auth/providers' || p === '/api/auth/config') return true;
    // Treat any provider-init or callback as public
    if (/^\/api\/auth\/[a-zA-Z0-9_-]+(\/callback)?$/.test(p)) return true;
  }
  return false;
}

export function sourceGuard() {
  return async (c: Context, next: () => Promise<void>) => {
    // Allow preflight
    if (c.req.method.toUpperCase() === 'OPTIONS') return next();

    // Validate X-App-Source header
    const hdr = (c.req.header('X-App-Source') || '').trim().toLowerCase();
    const src = hdr === 'admin' || hdr === 'main' ? hdr : 'main';

    // For admin source, require authentication for all non-auth public endpoints
    if (src === 'admin') {
      const path = c.req.path;
      if (!isAuthPublicPath(path, c.req.method)) {
        // Reuse existing auth middleware (required)
        const mw = createAuthMiddleware({ required: true });
        return mw(c as any, next);
      }
    }

    await next();
  };
}
