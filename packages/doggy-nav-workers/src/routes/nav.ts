import { Hono } from 'hono';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';
import { publicRoute, createAuthMiddleware, requireRole } from '../middleware/auth';
import type { NavAdminService } from 'doggy-nav-core';

export const navRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

navRoutes.get('/list', publicRoute(), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const status = c.req.query('status');
    const name = c.req.query('name') || undefined;
    const categoryId = c.req.query('categoryId') || undefined;

    const svc = getDI(c).resolve(TOKENS.NavService);
    const user = (c as any).get?.('user');
    const auth = user
      ? ({
          roles: Array.isArray(user.roles) ? user.roles : [],
          groups: Array.isArray(user.groups) ? user.groups : [],
          source: 'main' as const,
        } as any)
      : undefined;

    const res = await svc.list(
      { pageSize, pageNumber },
      {
        ...(status !== undefined ? { status: Number(status) } : {}),
        ...(name ? { name } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      auth
    );

    return c.json(responses.ok(res));
  } catch (err) {
    console.error('Worker nav list error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// GET /api/nav/ranking (server-compat)
navRoutes.get('/ranking', publicRoute(), async (c) => {
  try {
    const topN = Math.min(Math.max(Number(c.req.query('limit') ?? 10), 1), 50);
    const db = c.env.DB;
    const user = (c as any).get?.('user');
    const isAuthenticated = !!user;
    const navVisibilitySql = isAuthenticated
      ? `b.audience_visibility != 'hide'`
      : `b.audience_visibility = 'public'`;
    const catVisibilitySql = isAuthenticated
      ? `c.audience_visibility != 'hide'`
      : `c.audience_visibility = 'public'`;
    const statusSql = isAuthenticated ? '1=1' : 'b.status = 0';

    const baseSelect = `SELECT b.id, b.category_id, b.name, b.href, b.description, b.logo, b.author_name, b.author_url,
                               b.audit_time, b.create_time, b.tags, b.view_count, b.star_count, b.status
                        FROM bookmarks b
                        LEFT JOIN categories c ON c.id = b.category_id
                        WHERE ${statusSql} AND ${navVisibilitySql} AND (b.category_id IS NULL OR ${catVisibilitySql})`;

    const mapRows = (rows: any[]) =>
      (rows || []).map((r) => ({
        id: String(r.id),
        categoryId: r.category_id ? String(r.category_id) : null,
        name: String(r.name),
        href: r.href ?? null,
        desc: r.description ?? null,
        logo: r.logo ?? null,
        authorName: r.author_name ?? null,
        authorUrl: r.author_url ?? null,
        auditTime: r.audit_time ?? null,
        createTime: r.create_time ? Number(r.create_time) : null,
        tags: (() => {
          try {
            return JSON.parse(r.tags || '[]');
          } catch {
            return [] as string[];
          }
        })(),
        view: typeof r.view_count === 'number' ? r.view_count : undefined,
        star: typeof r.star_count === 'number' ? r.star_count : undefined,
        status: typeof r.status === 'number' ? r.status : undefined,
      }));

    const viewRs = await db
      .prepare(`${baseSelect} ORDER BY b.view_count DESC, b.updated_at DESC LIMIT ?`)
      .bind(topN)
      .all<any>();
    const starRs = await db
      .prepare(`${baseSelect} ORDER BY b.star_count DESC, b.updated_at DESC LIMIT ?`)
      .bind(topN)
      .all<any>();
    const newsRs = await db
      .prepare(`${baseSelect} ORDER BY b.create_time DESC LIMIT ?`)
      .bind(topN)
      .all<any>();

    const view = mapRows(viewRs.results || []);
    const star = mapRows(starRs.results || []);
    const news = mapRows(newsRs.results || []);

    return c.json(responses.ok({ view, star, news }));
  } catch (err) {
    console.error('Worker nav ranking error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// GET /api/nav/random (server-compat)
navRoutes.get('/random', publicRoute(), async (c) => {
  try {
    const count = Math.min(
      Math.max(Number(c.req.query('count') ?? c.req.query('limit') ?? 10) || 10, 1),
      50
    );

    const user = (c as any).get?.('user');
    const isAuthenticated = !!user;

    const navVisibilitySql = isAuthenticated
      ? `b.audience_visibility != 'hide'`
      : `b.audience_visibility = 'public'`;
    const catVisibilitySql = isAuthenticated
      ? `c.audience_visibility != 'hide'`
      : `c.audience_visibility = 'public'`;
    const statusSql = isAuthenticated ? '1=1' : 'b.status = 0';

    const rs = await c.env.DB
      .prepare(
        `SELECT b.id, b.category_id, b.name, b.href, b.description, b.logo, b.author_name, b.author_url,
                b.audit_time, b.create_time, b.tags, b.view_count, b.star_count, b.status
         FROM bookmarks b
         LEFT JOIN categories c ON c.id = b.category_id
         WHERE ${statusSql} AND ${navVisibilitySql} AND (b.category_id IS NULL OR ${catVisibilitySql})
         ORDER BY RANDOM() LIMIT ?`
      )
      .bind(count)
      .all<any>();

    const rows: any[] = rs.results || [];
    const data = rows.map((r) => ({
      id: String(r.id),
      categoryId: r.category_id ? String(r.category_id) : null,
      name: String(r.name),
      href: r.href ?? null,
      desc: r.description ?? null,
      logo: r.logo ?? null,
      authorName: r.author_name ?? null,
      authorUrl: r.author_url ?? null,
      auditTime: r.audit_time ?? null,
      createTime: r.create_time ? Number(r.create_time) : null,
      tags: (() => {
        try {
          return JSON.parse(r.tags || '[]');
        } catch {
          return [] as string[];
        }
      })(),
      view: typeof r.view_count === 'number' ? r.view_count : undefined,
      star: typeof r.star_count === 'number' ? r.star_count : undefined,
      status: typeof r.status === 'number' ? r.status : undefined,
    }));

    // Server returns array (data is the array), not wrapped in { data }
    return c.json(responses.ok(data));
  } catch (err) {
    console.error('Worker nav random error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// GET /api/nav (server-compat: details by id)
navRoutes.get('/', publicRoute(), async (c) => {
  try {
    const id = c.req.query('id');
    const keyword = c.req.query('keyword');
    if (id) {
      const user = (c as any).get?.('user');
      const isAuthenticated = !!user;

      const navVisibilitySql = isAuthenticated
        ? `audience_visibility != 'hide'`
        : `audience_visibility = 'public'`;

      const row = await c.env.DB.prepare(
        `SELECT * FROM bookmarks WHERE ${navVisibilitySql} AND id = ? ${!isAuthenticated ? 'AND status = 0' : ''} LIMIT 1`
      )
        .bind(id)
        .first<any>();
      if (!row) return c.json(responses.ok(null));

      // Map to server-compatible NavItem shape
      const nav: any = {
        id: String(row.id),
        categoryId: row.category_id ? String(row.category_id) : null,
        name: String(row.name),
        href: row.href ?? null,
        desc: row.description ?? null,
        logo: row.logo ?? null,
        authorName: row.author_name ?? null,
        authorUrl: row.author_url ?? null,
        auditTime: row.audit_time ?? null,
        createTime: row.create_time ? Number(row.create_time) : null,
        tags: (() => {
          try {
            return JSON.parse(row.tags || '[]');
          } catch {
            return [];
          }
        })(),
        view: typeof row.view_count === 'number' ? row.view_count : undefined,
        star: typeof row.star_count === 'number' ? row.star_count : undefined,
        status: typeof row.status === 'number' ? row.status : undefined,
      };

      // Attach category name if exists
      if (nav.categoryId) {
        const cat = await c.env.DB.prepare(`SELECT name FROM categories WHERE id = ? LIMIT 1`)
          .bind(nav.categoryId)
          .first<any>();
        if (cat?.name) nav.categoryName = String(cat.name);
      }

      // Favorite flag for authenticated users
      if (isAuthenticated && user?.id) {
        const fav = await c.env.DB.prepare(
          `SELECT 1 as one FROM favorites WHERE user_id = ? AND bookmark_id = ? LIMIT 1`
        )
          .bind(user.id, nav.id)
          .first<any>();
        nav.isFavorite = !!fav;
      }

      return c.json(responses.ok(nav));
    }
    if (keyword) {
      // Support both (pageSize/pageNumber) and (limit/page) param styles
      const pageSize = Math.min(
        Math.max(Number(c.req.query('pageSize') ?? c.req.query('limit') ?? 10) || 10, 1),
        100
      );
      const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? c.req.query('page') ?? 1) || 1, 1);
      const offset = (pageNumber - 1) * pageSize;

      const user = (c as any).get?.('user');
      const isAuthenticated = !!user;
      const navVisibilitySql = isAuthenticated
        ? `b.audience_visibility != 'hide'`
        : `b.audience_visibility = 'public'`;
      const catVisibilitySql = isAuthenticated
        ? `c.audience_visibility != 'hide'`
        : `c.audience_visibility = 'public'`;
      const statusSql = isAuthenticated ? '1=1' : 'b.status = 0';

      const baseWhere = `WHERE ${statusSql} AND ${navVisibilitySql} AND (b.category_id IS NULL OR ${catVisibilitySql}) AND b.name LIKE ?`;

      const countRs = await c.env.DB
        .prepare(
          `SELECT COUNT(1) as cnt
           FROM bookmarks b LEFT JOIN categories c ON c.id = b.category_id
           ${baseWhere}`
        )
        .bind(`%${keyword}%`)
        .all<any>();
      const total = Number(countRs.results?.[0]?.cnt || 0);

      const listRs = await c.env.DB
        .prepare(
          `SELECT b.id, b.category_id, b.name, b.href, b.description, b.logo, b.author_name, b.author_url,
                  b.audit_time, b.create_time, b.tags, b.view_count, b.star_count, b.status,
                  c.name as category_name
           FROM bookmarks b LEFT JOIN categories c ON c.id = b.category_id
           ${baseWhere}
           ORDER BY b.updated_at DESC LIMIT ? OFFSET ?`
        )
        .bind(`%${keyword}%`, pageSize, offset)
        .all<any>();
      const rows: any[] = listRs.results || [];

      // Favorites marking for authenticated users
      let favoriteSet: Set<string> | null = null;
      if (isAuthenticated && user?.id) {
        const favRs = await c.env.DB
          .prepare(`SELECT bookmark_id FROM favorites WHERE user_id = ?`)
          .bind(user.id)
          .all<any>();
        favoriteSet = new Set((favRs.results || []).map((r: any) => String(r.bookmark_id)));
      }

      const data = rows.map((r) => ({
        id: String(r.id),
        categoryId: r.category_id ? String(r.category_id) : null,
        name: String(r.name),
        href: r.href ?? null,
        desc: r.description ?? null,
        logo: r.logo ?? null,
        authorName: r.author_name ?? null,
        authorUrl: r.author_url ?? null,
        auditTime: r.audit_time ?? null,
        createTime: r.create_time ? Number(r.create_time) : null,
        tags: (() => {
          try {
            return JSON.parse(r.tags || '[]');
          } catch {
            return [] as string[];
          }
        })(),
        view: typeof r.view_count === 'number' ? r.view_count : undefined,
        star: typeof r.star_count === 'number' ? r.star_count : undefined,
        status: typeof r.status === 'number' ? r.status : undefined,
        categoryName: r.category_name ?? null,
        isFavorite: favoriteSet ? favoriteSet.has(String(r.id)) : undefined,
      }));

      return c.json(responses.ok({ data, total, pageNumber: Math.ceil(total / pageSize) }));
    }
    return c.json(responses.badRequest('id or keyword required'), 400);
  } catch (err) {
    console.error('Worker nav get error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// GET /api/nav/find (server-compat: basic by categoryId)
navRoutes.get('/find', publicRoute(), async (c) => {
  try {
    const categoryId = c.req.query('categoryId');
    if (!categoryId) return c.json(responses.badRequest('categoryId required'), 400);
    const db = c.env.DB;

    // Determine audience visibility based on auth (public route may attach user)
    const user = (c as any).get?.('user');
    const isAuthenticated = !!user;
    // Category visibility filter
    const catVisibilitySql = isAuthenticated
      ? `audience_visibility != 'hide'`
      : `audience_visibility = 'public'`;

    // 1) Load target category and its direct children (server parity: id OR parent match)
    const catsRs = await db
      .prepare(
        `SELECT id, name FROM categories
        WHERE (${catVisibilitySql}) AND (id = ? OR category_id = ?)
        ORDER BY id DESC`
      )
      .bind(categoryId, categoryId)
      .all<any>();
    const categories: Array<{ id: string; name: string }> = (catsRs.results || []).map(
      (r: any) => ({
        id: String(r.id),
        name: String(r.name),
      })
    );

    if (categories.length === 0) {
      return c.json(responses.ok([]));
    }

    const catIds = categories.map((c) => c.id);

    // 2) Favorites for current user (optional)
    let favoriteSet: Set<string> | null = null;
    if (isAuthenticated && user?.id) {
      const favRs = await db
        .prepare(`SELECT bookmark_id FROM favorites WHERE user_id = ?`)
        .bind(user.id)
        .all<any>();
      const favRows: any[] = favRs.results || [];
      favoriteSet = new Set(favRows.map((r: any) => String(r.bookmark_id)));
    }

    // 3) Load nav items for these categories, applying status/audience filters
    const placeholders = catIds.map(() => '?').join(',');
    const params: any[] = [...catIds];

    // Status: server shows approved (0); authenticated may also see legacy no-status, but D1 uses default 0
    const statusSql = `status = 0`;
    const navVisibilitySql = isAuthenticated
      ? `audience_visibility != 'hide'`
      : `audience_visibility = 'public'`;

    const navSql = `SELECT id, category_id, name, href, description, logo, author_name, author_url,
                    audit_time, create_time, tags, view_count, star_count, status
                    FROM bookmarks
                    WHERE ${statusSql} AND ${navVisibilitySql} AND category_id IN (${placeholders})
                    ORDER BY updated_at DESC`;

    const navRs = await db
      .prepare(navSql)
      .bind(...params)
      .all<any>();
    const navRows: any[] = navRs.results || [];

    // 4) Map rows and group by category
    const byCat = new Map<string, any[]>();
    for (const r of navRows) {
      const item = {
        id: String(r.id),
        categoryId: r.category_id ? String(r.category_id) : null,
        name: String(r.name),
        href: r.href ?? null,
        desc: r.description ?? null,
        logo: r.logo ?? null,
        authorName: r.author_name ?? null,
        authorUrl: r.author_url ?? null,
        auditTime: r.audit_time ?? null,
        createTime: r.create_time ? Number(r.create_time) : null,
        tags: (() => {
          try {
            return JSON.parse(r.tags || '[]');
          } catch {
            return [] as string[];
          }
        })(),
        view: typeof r.view_count === 'number' ? r.view_count : undefined,
        star: typeof r.star_count === 'number' ? r.star_count : undefined,
        status: typeof r.status === 'number' ? r.status : undefined,
        isFavorite: favoriteSet ? favoriteSet.has(String(r.id)) : undefined,
      };
      const cid = item.categoryId || '';
      if (!byCat.has(cid)) byCat.set(cid, []);
      byCat.get(cid)!.push(item);
    }

    // 5) Build response array in the same shape as server
    const resData = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      list: byCat.get(cat.id) || [],
    }));

    return c.json(responses.ok(resData));
  } catch (err) {
    console.error('Worker nav find error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// PUT /api/nav/audit (server-compat) - stub for now
navRoutes.put('/audit', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json();
    const { id, status, reason } = body || {};
    if (!id || typeof status !== 'number') return c.json(responses.badRequest('id and status required'), 400);
    const svc = getDI(c).resolve(TOKENS.NavAdminService) as NavAdminService;
    const ok = await (svc as any).audit(String(id), Number(status), reason);
    if (!ok) return c.json(responses.notFound('Nav item not found'), 404);
    return c.json(responses.ok({ id, status }));
  } catch (err) {
    console.error('Worker nav audit error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// POST /api/nav/:id/view
navRoutes.post('/:id/view', async (c) => {
  try {
    const { id } = c.req.param();
    await c.env.DB
      .prepare(`UPDATE bookmarks SET view_count = COALESCE(view_count,0) + 1 WHERE id = ?`)
      .bind(id)
      .run();
    const row = await c.env.DB
      .prepare(`SELECT view_count FROM bookmarks WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    const view = typeof row?.view_count === 'number' ? row.view_count : undefined;
    return c.json(responses.ok({ id, view }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

// POST /api/nav/:id/star
navRoutes.post('/:id/star', async (c) => {
  try {
    const { id } = c.req.param();
    await c.env.DB
      .prepare(`UPDATE bookmarks SET star_count = COALESCE(star_count,0) + 1 WHERE id = ?`)
      .bind(id)
      .run();
    const row = await c.env.DB
      .prepare(`SELECT star_count FROM bookmarks WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    const star = typeof row?.star_count === 'number' ? row.star_count : undefined;
    return c.json(responses.ok({ id, star }));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

// GET /api/nav/reptile - not supported in Workers (external HTML parse)
navRoutes.get('/reptile', async (c) => {
  try {
    const target = c.req.query('url');
    if (!target) return c.json(responses.badRequest('url required'), 400);
    const res = await fetch(target, { method: 'GET' });
    const html = await res.text();
    const name = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim();
    const desc =
      (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ||
        html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1] ||
        `试试 ${target} 吧`).trim();
    const iconHref =
      html.match(/<link[^>]+rel=["'](?:shortcut\s+icon|icon|apple-touch-icon)["'][^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] ||
      '';
    let logo = iconHref;
    try {
      const u = new URL(target);
      if (!logo) {
        logo = `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`;
      } else if (!/^https?:\/\//i.test(logo) && !logo.startsWith('//')) {
        logo = logo.startsWith('/') ? `${u.origin}${logo}` : `${u.origin}/${logo}`;
      } else if (logo.startsWith('//')) {
        logo = `${u.protocol}${logo}`;
      }
    } catch {}
    return c.json(responses.ok({ name, href: target, desc, logo }));
  } catch (err) {
    console.error('reptile error:', err);
    return c.json(responses.serverError('获取网站信息失败'), 500);
  }
});

// POST /api/nav (server-compat: add nav)
navRoutes.post('/', publicRoute(), async (c) => {
  try {
    const body = await c.req.json();
    const { name, href, desc, logo, categoryId, tags, authorName, authorUrl, audience } = body || {};
    const svc = getDI(c).resolve(TOKENS.NavAdminService) as NavAdminService;
    try {
      const res = await (svc as any).create({
        name,
        href,
        desc,
        logo,
        categoryId,
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
        authorName,
        authorUrl,
        audience,
      });
      return c.json(responses.ok({ id: res.id }));
    } catch (e: any) {
      if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
      throw e;
    }
  } catch (err) {
    console.error('Worker nav create error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// PUT /api/nav (server-compat: update nav)
navRoutes.put('/', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, href, desc, logo, categoryId, tags, authorName, authorUrl, audience } = body || {};
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const svc = getDI(c).resolve(TOKENS.NavAdminService) as NavAdminService;
    const res = await (svc as any).update(String(id), {
      name,
      href,
      desc,
      logo,
      categoryId,
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((s: string) => s.trim()).filter(Boolean) : undefined,
      authorName,
      authorUrl,
      audience,
    });
    if (!res) return c.json(responses.notFound('Nav item not found'), 404);
    return c.json(responses.ok({ id: res.id }));
  } catch (err) {
    console.error('Worker nav update error:', err);
    return c.json(responses.serverError(), 500);
  }
});

// DELETE /api/nav (server-compat: delete nav)
navRoutes.delete('/', createAuthMiddleware({ required: true }), requireRole('admin'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const svc = getDI(c).resolve(TOKENS.NavAdminService) as NavAdminService;
    const ok = await (svc as any).delete(String(id));
    if (!ok) return c.json(responses.notFound('Nav item not found'), 404);
    return c.json(responses.ok(true));
  } catch (err) {
    console.error('Worker nav delete error:', err);
    return c.json(responses.serverError(), 500);
  }
});
