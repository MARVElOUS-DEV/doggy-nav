import { Hono } from 'hono';
import { TagService } from 'doggy-nav-core';
import D1TagRepository from '../adapters/d1TagRepository';
import { responses } from '../index';

export const tagRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

tagRoutes.get('/list', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const svc = new TagService(new D1TagRepository(c.env.DB));
    const res = await svc.list({ pageSize, pageNumber });
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Worker tag list error:', err);
    return c.json(responses.serverError(), 500);
  }
});
