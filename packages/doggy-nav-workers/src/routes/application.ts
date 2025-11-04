import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';

export const applicationRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Secret generation now handled by core ApplicationService

applicationRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { name, description, allowedOrigins } = await c.req.json();
    if (!name) return c.json(responses.badRequest('name required'), 400);
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const app = await svc.create(name, description, allowedOrigins);
    return c.json(responses.ok(app));
  } catch (err) {
    console.error('client app create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.get('/list', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const res = await svc.list({ pageSize, pageNumber });
    return c.json(responses.ok(res));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.post('/verify-client-secret', async (c) => {
  try {
    const { clientSecret } = await c.req.json();
    if (!clientSecret) return c.json(responses.badRequest('clientSecret required'), 400);
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const valid = await svc.verifyClientSecret(clientSecret);
    return c.json(responses.ok({ valid }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.put('/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const { name, description, allowedOrigins, isActive } = await c.req.json();
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const updated = await svc.update(id, { name, description, allowedOrigins, isActive });
    if (!updated) return c.json(responses.notFound('Application not found'), 404);
    return c.json(responses.ok({ id: updated.id }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.post('/:id/regenerate-secret', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const secret = await svc.regenerateClientSecret(id);
    return c.json(responses.ok({ clientSecret: secret }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.delete('/:id/revoke', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const svc = getDI(c).resolve(TOKENS.ApplicationService) as any;
    const ok = await svc.revoke(id);
    if (!ok) return c.json(responses.notFound('Application not found'), 404);
    return c.json(responses.ok({ revoked: true }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

export default applicationRoutes;

function cryptoRandomId() {
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 24);
}
