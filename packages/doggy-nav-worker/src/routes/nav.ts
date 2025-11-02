import { Hono } from 'hono';
import { NavService, CategoryService } from 'doggy-nav-core';
import D1NavRepository from '../adapters/d1NavRepository';
import D1CategoryRepository from '../adapters/d1CategoryRepository';
import { responses } from '../index';

export const navRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

navRoutes.get('/list', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const status = c.req.query('status');
    const name = c.req.query('name') || undefined;
    const categoryId = c.req.query('categoryId') || undefined;

    const navRepo = new D1NavRepository(c.env.DB);
    const catRepo = new D1CategoryRepository(c.env.DB);
    const svc = new NavService(navRepo, catRepo);

    const res = await svc.list({ pageSize, pageNumber }, {
      ...(status !== undefined ? { status: Number(status) } : {}),
      ...(name ? { name } : {}),
      ...(categoryId ? { categoryId } : {}),
    }, undefined);

    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Worker nav list error:', err);
    return c.json(responses.serverError(), 500);
  }
});
