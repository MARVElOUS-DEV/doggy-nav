import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { responses } from '../utils/responses';
import { TOKENS } from '../ioc/tokens';
import { getDI, getUser } from '../ioc/helpers';

export const favoriteRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

favoriteRoutes.post('/add', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const { navId } = await c.req.json();
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
    const cmd = getDI(c).resolve(TOKENS.FavoriteCommandService);
    const created = await cmd.add(String(user.id), String(navId));
    return c.json(responses.ok(created));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Add favorite failed'), 400);
  }
});

favoriteRoutes.get('/remove', createAuthMiddleware({ required: true }), async (c) => {
  try {
  const user = getUser(c)!;
  const di = getDI(c);
    const navId = c.req.query('navId');
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
  const cmd = di.resolve(TOKENS.FavoriteCommandService);
    const res = await cmd.remove(String(user.id), String(navId));
    if (!res.ok) return c.json(responses.badRequest('收藏不存在'), 400);
    return c.json(responses.ok({ message: '取消收藏成功' }));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Remove favorite failed'), 400);
  }
});

// Server-compat: POST /api/favorites (add)
favoriteRoutes.post('/', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const { navId } = await c.req.json();
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
    const cmd = getDI(c).resolve(TOKENS.FavoriteCommandService);
    const created = await cmd.add(String(user.id), String(navId));
    return c.json(responses.ok(created));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Add favorite failed'), 400);
  }
});

// Server-compat: POST /api/favorites/remove
favoriteRoutes.post('/remove', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const di = getDI(c);
    const body = await c.req.json().catch(() => ({}));
    const navId = body?.navId || c.req.query('navId');
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
    const cmd = di.resolve(TOKENS.FavoriteCommandService);
    const res = await cmd.remove(String(user.id), String(navId));
    if (!res.ok) return c.json(responses.badRequest('收藏不存在'), 400);
    return c.json(responses.ok({ message: '取消收藏成功' }));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Remove favorite failed'), 400);
  }
});

favoriteRoutes.get('/list', createAuthMiddleware({ required: true }), async (c) => {
  const user = getUser(c)!;
  const di = getDI(c);
  const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
  const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
  const svc = di.resolve(TOKENS.FavoriteService);
  const res = await svc.list(String(user.id), { pageSize, pageNumber });
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/check', createAuthMiddleware(), async (c) => {
  const user = getUser(c)!;
  const di = getDI(c);
  const navId = c.req.query('navId');
  if (!navId) return c.json(responses.badRequest('navId is required'), 400);
  if (!user) return c.json(responses.ok({ isFavorite: false }));
  const svc = di.resolve(TOKENS.FavoriteService);
  const res = await svc.check(String(user.id), String(navId));
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/count', createAuthMiddleware({ required: true }), async (c) => {
  const user = getUser(c)!;
  const di = getDI(c);
  const svc = di.resolve(TOKENS.FavoriteService);
  const res = await svc.count(String(user.id));
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/structured', createAuthMiddleware({ required: true }), async (c) => {
  const user = getUser(c)!;
  const di = getDI(c);
  const svc = di.resolve(TOKENS.FavoriteService);
  const res = await svc.structured(String(user.id));
  return c.json(responses.ok(res));
});

// Server-compat: Favorite folders & placements (stubs for now)
favoriteRoutes.post('/folders', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const di = getDI(c);
    const svc = di.resolve(TOKENS.FavoriteFolderService);
    const body = await c.req.json();
    const { name, navIds = [], order } = body || {};
    if (!name) return c.json(responses.badRequest('name is required'), 400);
    const res = await (svc as any).createFolder(String(user.id), { name, navIds, order });
    return c.json(responses.ok(res));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

favoriteRoutes.put('/folders/:id', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const di = getDI(c);
    const svc = di.resolve(TOKENS.FavoriteFolderService);
    const { id } = c.req.param();
    const body = await c.req.json();
    const { name, addNavIds = [], removeNavIds = [], order } = body || {};
    if (!id) return c.json(responses.badRequest('id is required'), 400);
    const res = await (svc as any).updateFolder(String(user.id), String(id), { name, addNavIds, removeNavIds, order });
    return c.json(responses.ok(res));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

favoriteRoutes.delete('/folders/:id', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const di = getDI(c);
    const svc = di.resolve(TOKENS.FavoriteFolderService);
    const { id } = c.req.param();
    if (!id) return c.json(responses.badRequest('id is required'), 400);
    const res = await (svc as any).deleteFolder(String(user.id), String(id));
    return c.json(responses.ok(res));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

favoriteRoutes.put('/placements', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const di = getDI(c);
    const svc = di.resolve(TOKENS.FavoriteFolderService);
    const body = await c.req.json().catch(() => ({}));
    const res = await (svc as any).placements(String(user.id), body || {});
    return c.json(responses.ok(res));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});
