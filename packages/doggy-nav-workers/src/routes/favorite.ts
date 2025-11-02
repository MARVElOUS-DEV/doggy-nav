import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { responses } from '../index';
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
