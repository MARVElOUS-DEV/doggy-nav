import { Hono } from 'hono';
import type { AfficheService } from 'doggy-nav-core';
import { getDI } from '../ioc/helpers';
import { TOKENS } from '../ioc/tokens';
import { responses } from '../utils/responses';
import { createAuthMiddleware, requireRole, publicRoute } from '../middleware/auth';

const afficheRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// Admin: list affiches (with optional active filter)
afficheRoutes.get('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const activeRaw = c.req.query('active');
    let active: boolean | undefined;
    if (activeRaw !== undefined && activeRaw !== '') {
      const v = String(activeRaw).toLowerCase();
      active = v === '1' || v === 'true';
    }
    const svc = getDI(c).resolve(TOKENS.AfficheService) as AfficheService;
    const res = await svc.list({ pageSize, pageNumber }, { active });
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Affiche list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Public: list active affiches for main site
afficheRoutes.get('/active', publicRoute(), async (c) => {
  try {
    const svc = getDI(c).resolve(TOKENS.AfficheService) as AfficheService;
    const res = await svc.listActive();
    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Affiche active list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Admin: create affiche
afficheRoutes.post('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body: any = await c.req.json();
    const text = String(body?.text || '').trim();
    if (!text) return c.json(responses.badRequest('text is required'), 400);

    const payload: {
      text: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    } = { text };

    if (body.linkHref !== undefined) {
      const v = String(body.linkHref || '').trim();
      payload.linkHref = v || null;
    }
    if (body.linkText !== undefined) {
      const v = String(body.linkText || '').trim();
      payload.linkText = v || null;
    }
    if (body.linkTarget !== undefined) {
      const v = String(body.linkTarget || '').trim();
      payload.linkTarget = v || null;
    }
    if (body.active !== undefined) {
      payload.active = !!body.active;
    }
    if (body.order !== undefined) {
      const n = Number(body.order);
      if (!Number.isNaN(n)) payload.order = n;
    }

    const svc = getDI(c).resolve(TOKENS.AfficheService) as AfficheService;
    const created = await svc.create(payload);
    return c.json(responses.ok(created));
  } catch (err) {
    console.error('Affiche create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Admin: update affiche
afficheRoutes.put('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body: any = await c.req.json();
    const id = String(body?.id || '').trim();
    if (!id) return c.json(responses.badRequest('id is required'), 400);

    const patch: {
      text?: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    } = {};

    if (body.text !== undefined) {
      const t = String(body.text).trim();
      if (!t) return c.json(responses.badRequest('text cannot be empty'), 400);
      patch.text = t;
    }
    if (body.linkHref !== undefined) {
      const v = String(body.linkHref || '').trim();
      patch.linkHref = v || null;
    }
    if (body.linkText !== undefined) {
      const v = String(body.linkText || '').trim();
      patch.linkText = v || null;
    }
    if (body.linkTarget !== undefined) {
      const v = String(body.linkTarget || '').trim();
      patch.linkTarget = v || null;
    }
    if (body.active !== undefined) {
      patch.active = !!body.active;
    }
    if (body.order !== undefined) {
      const n = Number(body.order);
      if (!Number.isNaN(n)) patch.order = n;
    }

    const svc = getDI(c).resolve(TOKENS.AfficheService) as AfficheService;
    const updated = await svc.update(id, patch);
    if (!updated) return c.json(responses.notFound('affiche not found'), 404);
    return c.json(responses.ok(updated));
  } catch (err) {
    console.error('Affiche update error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// Admin: delete affiche
afficheRoutes.delete('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body: any = await c.req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    if (!id) return c.json(responses.badRequest('id is required'), 400);
    const svc = getDI(c).resolve(TOKENS.AfficheService) as AfficheService;
    const ok = await svc.delete(id);
    if (!ok) return c.json(responses.notFound('affiche not found'), 404);
    return c.json(responses.ok(true));
  } catch (err) {
    console.error('Affiche delete error:', err);
    return c.json(responses.serverError(), 500);
  }
});

export default afficheRoutes;
