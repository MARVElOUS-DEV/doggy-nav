import type { Context } from 'hono';
import { getRoutePermission, hasAccess } from 'doggy-nav-core';
import { responses } from '../utils/responses';
import { createAuthMiddleware } from './auth';

export function accessControl() {
  return async (c: Context, next: () => Promise<void>) => {
    const method = c.req.method.toUpperCase();
    const path = c.req.path;
    const perm = getRoutePermission(method, path);
    if (!perm) return next();

    const req = perm.require;
    // Ensure we have user context when needed; otherwise, try to populate optionally
    if (req && req.level !== 'public' && (req.level === 'authenticated' || req.anyRole || req.anyGroup || req.anyPermission || req.allPermissions)) {
      // Populate user context if missing; do not force early response here
      const mw = createAuthMiddleware({ required: false });
      await mw(c as any, async () => {});
    }

    const user = c.get('user');
    const allowed = hasAccess(perm, user);
    if (!allowed) {
      // If this route requires auth or specific claims, enforce 401/403
      if (!user && req && req.level !== 'public' && req.level !== 'optional') {
        return c.json(responses.err('Authentication required'), 401);
      }
      return c.json(responses.err('Forbidden'), 403);
    }

    await next();
  };
}
