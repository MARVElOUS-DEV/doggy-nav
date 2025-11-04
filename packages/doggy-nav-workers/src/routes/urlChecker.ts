import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export const urlCheckerRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

urlCheckerRoutes.get('/status', async (c) => {
  const stats = await c.env.DB.prepare(`SELECT 
      SUM(CASE WHEN url_status='accessible' THEN 1 ELSE 0 END) AS ok,
      SUM(CASE WHEN url_status='inaccessible' THEN 1 ELSE 0 END) AS bad,
      SUM(CASE WHEN url_status IS NULL OR url_status='unknown' THEN 1 ELSE 0 END) AS unknown
    FROM bookmarks`).first<any>();
  return c.json(responses.ok({ running: false, stats: { ok: Number(stats?.ok||0), bad: Number(stats?.bad||0), unknown: Number(stats?.unknown||0) } }));
});

urlCheckerRoutes.post('/start', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  return c.json(responses.serverError('URL checker not implemented on Workers'), 501);
});

urlCheckerRoutes.post('/stop', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  return c.json(responses.serverError('URL checker not implemented on Workers'), 501);
});

urlCheckerRoutes.post('/restart', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  return c.json(responses.serverError('URL checker not implemented on Workers'), 501);
});

urlCheckerRoutes.put('/config', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  return c.json(responses.serverError('URL checker not implemented on Workers'), 501);
});

urlCheckerRoutes.post('/check', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const href = body?.href;
    if (!href) return c.json(responses.badRequest('href required'), 400);
    const start = Date.now();
    let status: 'accessible' | 'inaccessible' = 'inaccessible';
    try {
      const r = await fetch(href, { method: 'HEAD' });
      status = r.ok ? 'accessible' : 'inaccessible';
    } catch {
      status = 'inaccessible';
    }
    const respMs = Date.now() - start;
    return c.json(responses.ok({ url: href, status, responseTime: respMs }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

urlCheckerRoutes.post('/check/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const row = await c.env.DB.prepare(`SELECT href FROM bookmarks WHERE id = ? LIMIT 1`).bind(id).first<any>();
    if (!row) return c.json(responses.notFound('bookmark not found'), 404);
    const start = Date.now();
    let status: 'accessible' | 'inaccessible' = 'inaccessible';
    try {
      const r = await fetch(row.href, { method: 'HEAD' });
      status = r.ok ? 'accessible' : 'inaccessible';
    } catch {
      status = 'inaccessible';
    }
    const respMs = Date.now() - start;
    await c.env.DB.prepare(`UPDATE bookmarks SET url_status = ?, response_time = ?, last_url_check = ? WHERE id = ?`).bind(status, respMs, Math.floor(Date.now()/1000), id).run();
    return c.json(responses.ok({ id, status, responseTime: respMs }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

urlCheckerRoutes.get('/nav-status', async (c) => {
  const rs = await c.env.DB.prepare(`SELECT id, name, href, url_status, response_time, last_url_check FROM bookmarks ORDER BY updated_at DESC LIMIT 100`).all<any>();
  return c.json(responses.ok({ items: rs.results || [] }));
});

export default urlCheckerRoutes;
