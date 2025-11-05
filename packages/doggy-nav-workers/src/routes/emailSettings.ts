import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

export const emailSettingsRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

emailSettingsRoutes.get('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  const svc = getDI(c).resolve(TOKENS.EmailSettingsService) as any;
  const value = await svc.get();
  return c.json(responses.ok(value));
});

emailSettingsRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  const b = await c.req.json();
  const svc = getDI(c).resolve(TOKENS.EmailSettingsService) as any;
  try {
    await svc.update(b);
    return c.json(responses.ok({ updated: true }));
  } catch (err: any) {
    const isValidation = err?.name === 'ValidationError';
    return c.json(isValidation ? responses.badRequest(err.message) : responses.serverError(), isValidation ? 400 : 500);
  }
});

emailSettingsRoutes.post('/test', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  // Basic validation-only test (Workers runtime cannot send SMTP directly without external service)
  const row = await c.env.DB.prepare(`SELECT * FROM email_settings WHERE id = 'default'`).first<any>();
  if (!row) return c.json(responses.badRequest('Email settings not configured'), 400);
  return c.json(responses.ok({ message: 'Config validated' }));
});

emailSettingsRoutes.get('/health', async (c) => {
  const svc = getDI(c).resolve(TOKENS.EmailSettingsService) as any;
  const v = await svc.get();
  return c.json(responses.ok({ status: v ? 'ok' : 'missing' }));
});

export default emailSettingsRoutes;
