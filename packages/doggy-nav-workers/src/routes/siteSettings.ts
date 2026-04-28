import { Hono } from 'hono';
import type { SiteSettingsService } from 'doggy-nav-core';
import { responses } from '../utils/responses';
import { createAuthMiddleware, publicRoute, requireRole } from '../middleware/auth';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

const siteSettingsRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

siteSettingsRoutes.get('/public', publicRoute(), async (c) => {
  try {
    const svc = getDI(c).resolve(TOKENS.SiteSettingsService) as SiteSettingsService;
    const value = await svc.get();
    return c.json(responses.ok(value));
  } catch (err) {
    console.error('Site settings public read error:', err);
    return c.json(responses.serverError(), 500);
  }
});

siteSettingsRoutes.get(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('admin'),
  async (c) => {
    try {
      const svc = getDI(c).resolve(TOKENS.SiteSettingsService) as SiteSettingsService;
      const value = await svc.get();
      return c.json(responses.ok(value));
    } catch (err) {
      console.error('Site settings read error:', err);
      return c.json(responses.serverError(), 500);
    }
  }
);

siteSettingsRoutes.put(
  '/',
  createAuthMiddleware({ required: true }),
  requireRole('admin'),
  async (c) => {
    const body = await c.req.json();
    const svc = getDI(c).resolve(TOKENS.SiteSettingsService) as SiteSettingsService;

    try {
      const updated = await svc.update(body);
      return c.json(responses.ok(updated));
    } catch (err: any) {
      const isValidation = err?.name === 'ValidationError';
      return c.json(
        isValidation ? responses.badRequest(err.message) : responses.serverError(),
        isValidation ? 400 : 500
      );
    }
  }
);

export default siteSettingsRoutes;
