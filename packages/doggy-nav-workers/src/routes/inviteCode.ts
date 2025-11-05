import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export const inviteCodeRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

inviteCodeRoutes.get('/list', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const active = c.req.query('active');
    const code = c.req.query('code') || '';

    const svc = getDI(c).resolve(TOKENS.InviteCodeService);
    const res = await svc.list({ pageSize, pageNumber }, {
      active: active !== undefined ? active === 'true' : undefined,
      codeSearch: code || undefined,
    });
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('InviteCode list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

inviteCodeRoutes.post('/create', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const { count, usageLimit, expiresAt, note, allowedEmailDomain } = body || {};
    const svc = getDI(c).resolve(TOKENS.InviteCodeService);
    const res = await svc.createBulkByCount({ count, usageLimit, expiresAt, note, allowedEmailDomain });
    return c.json(responses.ok(res));
  } catch (err: any) {
    console.error('InviteCode create error:', err);
    const msg = err?.message || 'Failed to create invite codes';
    return c.json(responses.badRequest(msg), 400);
  }
});

// Server-compat: POST /api/invite-codes
inviteCodeRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const { count, usageLimit, expiresAt, note, allowedEmailDomain } = body || {};
    const svc = getDI(c).resolve(TOKENS.InviteCodeService);
    const res = await svc.createBulkByCount({ count, usageLimit, expiresAt, note, allowedEmailDomain });
    return c.json(responses.ok(res));
  } catch (err: any) {
    const msg = err?.message || 'Failed to create invite codes';
    return c.json(responses.badRequest(msg), 400);
  }
});

inviteCodeRoutes.put('/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const patch = await c.req.json();
    const svc = getDI(c).resolve(TOKENS.InviteCodeService);
    const updated = await svc.update(id, patch);
    if (!updated) return c.json(responses.notFound('Invite code not found'), 404);
    return c.json(responses.ok(updated));
  } catch (err: any) {
    const msg = err?.name === 'ValidationError' ? err.message : 'Failed to update invite code';
    const code = err?.name === 'ValidationError' ? 400 : 500;
    return c.json(code === 400 ? responses.badRequest(msg) : responses.serverError(msg), code);
  }
});

inviteCodeRoutes.post('/:id/revoke', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const svc = getDI(c).resolve(TOKENS.InviteCodeService);
    const updated = await svc.update(id, { active: false });
    if (!updated) return c.json(responses.notFound('Invite code not found'), 404);
    return c.json(responses.ok(updated));
  } catch (err) {
    console.error('InviteCode revoke error:', err);
    return c.json(responses.serverError(), 500);
  }
});
