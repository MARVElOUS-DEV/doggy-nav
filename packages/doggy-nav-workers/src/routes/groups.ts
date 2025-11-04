import { Hono } from 'hono';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { responses } from '../utils/responses';

type Env = { DB: D1Database };

export const groupRoutes = new Hono<{ Bindings: Env }>();

groupRoutes.get('/', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 50), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);

    const service = getDI(c).resolve(TOKENS.GroupService);
    const result = await service.list({ pageSize, pageNumber });

    return c.json(responses.ok(result));
  } catch (error) {
    console.error('Group list error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = getDI(c).resolve(TOKENS.GroupService);
    const data = await service.getOne(id);

    if (!data) {
      return c.json(responses.notFound('Group not found'), 404);
    }

    return c.json(responses.ok({ data }));
  } catch (error) {
    console.error('Group detail error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const { slug, displayName, description } = body || {};
    if (!slug || !displayName) return c.json(responses.badRequest('slug and displayName are required'), 400);
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    const created = await (repo as any).create({ slug, displayName, description });
    return c.json(responses.ok({ data: created }), 201);
  } catch (error) {
    console.error('Group create error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.put('/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    const updated = await (repo as any).update(id, {
      slug: body.slug,
      displayName: body.displayName,
      description: body.description,
    });
    if (!updated) return c.json(responses.notFound('Group not found'), 404);
    return c.json(responses.ok({ data: updated }));
  } catch (error) {
    console.error('Group update error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: PUT /api/groups (body.id)
groupRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json();
    const { id, slug, displayName, description } = body || {};
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    const updated = await (repo as any).update(id, { slug, displayName, description });
    if (!updated) return c.json(responses.notFound('Group not found'), 404);
    return c.json(responses.ok({ data: updated }));
  } catch (error) {
    console.error('Group update (compat) error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.delete('/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    const ok = await (repo as any).delete(id);
    if (!ok) return c.json(responses.notFound('Group not found'), 404);
    return c.json(responses.ok({}));
  } catch (error) {
    console.error('Group delete error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: DELETE /api/groups (body.ids)
groupRoutes.delete('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return c.json(responses.badRequest('ids required'), 400);
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    let ok = true;
    for (const id of ids) {
      const del = await (repo as any).delete(id);
      ok = ok && del;
    }
    return c.json(ok ? responses.ok({}) : responses.serverError('Failed to delete some groups'), ok ? 200 : 500);
  } catch (error) {
    console.error('Group delete (compat) error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.post('/:id/users', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];
    if (!userIds.length) return c.json(responses.badRequest('userIds must be a non-empty array'), 400);
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    await (repo as any).setGroupUsers(id, userIds);
    return c.json(responses.ok({ modified: userIds.length }));
  } catch (error) {
    console.error('Group members update error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat alias: POST /api/groups/:id/members
groupRoutes.post('/:id/members', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds : [];
    if (!userIds.length) return c.json(responses.badRequest('userIds must be a non-empty array'), 400);
    const repo = getDI(c).resolve(TOKENS.GroupRepo) as any;
    await (repo as any).setGroupUsers(id, userIds);
    return c.json(responses.ok({ modified: userIds.length }));
  } catch (error) {
    console.error('Group members update error:', error);
    return c.json(responses.serverError(), 500);
  }
});
