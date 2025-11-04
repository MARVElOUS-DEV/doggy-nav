import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

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
    if (!name) return c.json(responses.badRequest('name required'), 400);
    const slug = toSlug(name);
    // ensure unique
    const exists = await c.env.DB
      .prepare(`SELECT id FROM tags WHERE slug = ? OR name = ? LIMIT 1`)
      .bind(slug, name)
      .first<any>();
    if (exists) return c.json(responses.badRequest('Tag already exists'), 409);
    const id = (globalThis.crypto?.randomUUID?.() as string) || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    await c.env.DB
      .prepare(`INSERT INTO tags (id, name, slug, description) VALUES (?, ?, ?, '')`)
      .bind(id, name, slug)
      .run();
    return c.json(responses.ok({ id, name }));
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
    const res = await c.env.DB.prepare(`DELETE FROM tags WHERE id = ?`).bind(id).run();
    if ((res.meta?.rows_written ?? 0) === 0) return c.json(responses.notFound('Tag not found'), 404);
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
    if (name !== undefined) {
      const slug = toSlug(name);
      const dup = await c.env.DB
        .prepare(`SELECT id FROM tags WHERE (slug = ? OR name = ?) AND id != ? LIMIT 1`)
        .bind(slug, name, id)
        .first<any>();
      if (dup) return c.json(responses.badRequest('Tag already exists'), 409);
      await c.env.DB
        .prepare(`UPDATE tags SET name = ?, slug = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?`)
        .bind(name, slug, id)
        .run();
    }
    return c.json(responses.ok({ id, name }));
  } catch (err) {
    console.error('Tag update error:', err);
    return c.json(responses.serverError(), 500);
  }
});

function toSlug(s: string): string {
  const base = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return base || 'tag';
}
