import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import type { TagService } from 'doggy-nav-core';

export const tagRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

tagRoutes.get('/list', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const svc = getDI(c).resolve(TOKENS.TagService);
    const res = await svc.list({ pageSize, pageNumber });
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Worker tag list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Create tag (server-compat)
tagRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const name = String(body?.name || '').trim();
    const svc = getDI(c).resolve(TOKENS.TagService) as TagService;
    try {
      const tag = await (svc as any).create(name);
      return c.json(responses.ok({ id: tag.id, name: tag.name }));
    } catch (e: any) {
      if (e?.name === 'ValidationError') {
        const msg = String(e.message || 'Invalid');
        const code = /exists/i.test(msg) ? 409 : 400;
        return c.json(code === 400 ? responses.badRequest(msg) : responses.badRequest(msg), code);
      }
      throw e;
    }
  } catch (err) {
    console.error('Tag create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Delete tag (server-compat)
tagRoutes.delete('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const svc = getDI(c).resolve(TOKENS.TagService) as TagService;
    const ok = await (svc as any).delete(id);
    if (!ok) return c.json(responses.notFound('Tag not found'), 404);
    return c.json(responses.ok(true));
  } catch (err) {
    console.error('Tag delete error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Update tag (server-compat)
tagRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const id = String(body?.id || '');
    const name = body?.name !== undefined ? String(body.name) : undefined;
    if (!id) return c.json(responses.badRequest('id required'), 400);
    if (name === undefined) return c.json(responses.badRequest('name required'), 400);
    const svc = getDI(c).resolve(TOKENS.TagService) as TagService;
    try {
      await (svc as any).update(id, name);
      return c.json(responses.ok({ id, name }));
    } catch (e: any) {
      if (e?.name === 'ValidationError') {
        const msg = String(e.message || 'Invalid');
        const code = /exists/i.test(msg) ? 409 : 400;
        return c.json(code === 400 ? responses.badRequest(msg) : responses.badRequest(msg), code);
      }
      throw e;
    }
  } catch (err) {
    console.error('Tag update error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// slug generation moved to adapter; core enforces name uniqueness
