import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { responses } from '../index';
import { FavoriteService, FavoriteCommandService } from 'doggy-nav-core';
import D1FavoriteRepository from '../adapters/d1FavoriteRepository';
import D1FavoriteCommandRepository from '../adapters/d1FavoriteCommandRepository';

export const favoriteRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

favoriteRoutes.post('/add', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = c.get('user');
    const { navId } = await c.req.json();
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
    const cmd = new FavoriteCommandService(new D1FavoriteCommandRepository(c.env.DB));
    const created = await cmd.add(String(user.id), String(navId));
    return c.json(responses.ok(created));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Add favorite failed'), 400);
  }
});

favoriteRoutes.get('/remove', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = c.get('user');
    const navId = c.req.query('navId');
    if (!navId) return c.json(responses.badRequest('navId is required'), 400);
    const cmd = new FavoriteCommandService(new D1FavoriteCommandRepository(c.env.DB));
    const res = await cmd.remove(String(user.id), String(navId));
    if (!res.ok) return c.json(responses.badRequest('收藏不存在'), 400);
    return c.json(responses.ok({ message: '取消收藏成功' }));
  } catch (err: any) {
    return c.json(responses.badRequest(err?.message || 'Remove favorite failed'), 400);
  }
});

favoriteRoutes.get('/list', createAuthMiddleware({ required: true }), async (c) => {
  const user = c.get('user');
  const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
  const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
  const svc = new FavoriteService(new D1FavoriteRepository(c.env.DB));
  const res = await svc.list(String(user.id), { pageSize, pageNumber });
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/check', createAuthMiddleware(), async (c) => {
  const user = c.get('user');
  const navId = c.req.query('navId');
  if (!navId) return c.json(responses.badRequest('navId is required'), 400);
  if (!user) return c.json(responses.ok({ isFavorite: false }));
  const svc = new FavoriteService(new D1FavoriteRepository(c.env.DB));
  const res = await svc.check(String(user.id), String(navId));
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/count', createAuthMiddleware({ required: true }), async (c) => {
  const user = c.get('user');
  const svc = new FavoriteService(new D1FavoriteRepository(c.env.DB));
  const res = await svc.count(String(user.id));
  return c.json(responses.ok(res));
});

favoriteRoutes.get('/structured', createAuthMiddleware({ required: true }), async (c) => {
  const user = c.get('user');
  const svc = new FavoriteService(new D1FavoriteRepository(c.env.DB));
  const res = await svc.structured(String(user.id));
  return c.json(responses.ok(res));
});
