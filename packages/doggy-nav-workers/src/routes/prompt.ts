import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import type { PromptService } from 'doggy-nav-core';

const promptRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

promptRoutes.get('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
    const res = await svc.list({ pageSize, pageNumber });
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Prompt list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

promptRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const name = String(body?.name || '').trim();
    const content = String(body?.content || '');
    const active = Boolean(body?.active);
    if (!name || !content) return c.json(responses.badRequest('name and content required'), 400);
    const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
    const p = await svc.create(name, content, active);
    return c.json(responses.ok(p));
  } catch (err) {
    console.error('Prompt create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

promptRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const id = String(body?.id || '');
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
    const p = await svc.update(id, {
      name: body?.name,
      content: body?.content,
      active: body?.active,
    });
    if (!p) return c.json(responses.notFound('Prompt not found'), 404);
    return c.json(responses.ok(p));
  } catch (err) {
    console.error('Prompt update error:', err);
    return c.json(responses.serverError(), 500);
  }
});

promptRoutes.delete('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const id = String(body?.id || '');
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
    const ok = await svc.delete(id);
    if (!ok) return c.json(responses.notFound('Prompt not found'), 404);
    return c.json(responses.ok(true));
  } catch (err) {
    console.error('Prompt delete error:', err);
    return c.json(responses.serverError(), 500);
  }
});

promptRoutes.post('/:id/activate', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const id = c.req.param('id');
    const svc = getDI(c).resolve(TOKENS.PromptService) as PromptService;
    const p = await svc.activate(id);
    if (!p) return c.json(responses.notFound('Prompt not found'), 404);
    return c.json(responses.ok(p));
  } catch (err) {
    console.error('Prompt activate error:', err);
    return c.json(responses.serverError(), 500);
  }
});

export default promptRoutes;
