import { Hono } from 'hono';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole } from '../middleware/auth';

export const applicationRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

function genSecret() {
  const hex = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < 64; i++) out += hex[Math.floor(Math.random() * hex.length)];
  return out;
}

applicationRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { name, description, allowedOrigins } = await c.req.json();
    if (!name) return c.json(responses.badRequest('name required'), 400);
    const id = cryptoRandomId();
    const secret = genSecret();
    const allowed = JSON.stringify(Array.isArray(allowedOrigins) ? allowedOrigins : []);
    await c.env.DB.prepare(`INSERT INTO client_applications (id, name, description, client_secret, is_active, allowed_origins) VALUES (?, ?, ?, ?, 1, ?)`)
      .bind(id, name, description || '', secret, allowed)
      .run();
    return c.json(responses.ok({ id, name, description: description || '', isActive: true, allowedOrigins: JSON.parse(allowed), clientSecret: secret }));
  } catch (err) {
    console.error('client app create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.get('/list', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const offset = (pageNumber - 1) * pageSize;
    const list = await c.env.DB.prepare(`SELECT id, name, description, is_active, allowed_origins, created_at, updated_at FROM client_applications ORDER BY created_at DESC LIMIT ? OFFSET ?`).bind(pageSize, offset).all<any>();
    const count = await c.env.DB.prepare(`SELECT COUNT(1) as cnt FROM client_applications`).all<any>();
    const total = Number(count.results?.[0]?.cnt || 0);
    const applications = (list.results || []).map((r: any) => ({
      id: r.id, name: r.name, description: r.description,
      isActive: !!r.is_active,
      allowedOrigins: JSON.parse(r.allowed_origins || '[]'),
      createdAt: r.created_at, updatedAt: r.updated_at,
    }));
    return c.json(responses.ok({ applications, total }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.post('/verify-client-secret', async (c) => {
  try {
    const { clientSecret } = await c.req.json();
    if (!clientSecret) return c.json(responses.badRequest('clientSecret required'), 400);
    const row = await c.env.DB.prepare(`SELECT id FROM client_applications WHERE client_secret = ? AND is_active = 1 LIMIT 1`).bind(clientSecret).first<any>();
    return c.json(responses.ok({ valid: !!row }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.put('/:id', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const { name, description, allowedOrigins, isActive } = await c.req.json();
    const fields: string[] = [];
    const params: any[] = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (allowedOrigins !== undefined) { fields.push('allowed_origins = ?'); params.push(JSON.stringify(Array.isArray(allowedOrigins) ? allowedOrigins : [])); }
    if (isActive !== undefined) { fields.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (!fields.length) return c.json(responses.badRequest('No updates provided'), 400);
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    const sql = `UPDATE client_applications SET ${fields.join(', ')} WHERE id = ?`;
    const res = await c.env.DB.prepare(sql).bind(...params, id).run();
    if ((res.meta?.rows_written ?? 0) === 0) return c.json(responses.notFound('Application not found'), 404);
    return c.json(responses.ok({ id }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.post('/:id/regenerate-secret', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const secret = genSecret();
    const res = await c.env.DB.prepare(`UPDATE client_applications SET client_secret = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(secret, id).run();
    if ((res.meta?.rows_written ?? 0) === 0) return c.json(responses.notFound('Application not found'), 404);
    return c.json(responses.ok({ clientSecret: secret }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

applicationRoutes.delete('/:id/revoke', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    const { id } = c.req.param();
    const res = await c.env.DB.prepare(`UPDATE client_applications SET is_active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`).bind(id).run();
    if ((res.meta?.rows_written ?? 0) === 0) return c.json(responses.notFound('Application not found'), 404);
    return c.json(responses.ok({ revoked: true }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

export default applicationRoutes;

function cryptoRandomId() {
  return (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 24);
}
