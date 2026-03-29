import { Hono } from 'hono';
import { responses } from '../utils/responses';

export const tagRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

tagRoutes.get('/list', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 10), 1), 200);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);
    const offset = (pageNumber - 1) * pageSize;
    const user = (c as any).get?.('user');
    const isAuthenticated = !!user;
    const navVisibilitySql = isAuthenticated
      ? `b.audience_visibility != 'hide'`
      : `b.audience_visibility = 'public'`;
    const catVisibilitySql = isAuthenticated
      ? `c.audience_visibility != 'hide'`
      : `c.audience_visibility = 'public'`;
    const statusSql = isAuthenticated
      ? `(b.status = 0 OR b.status IS NULL)`
      : `b.status = 0`;

    const baseFrom = `
      FROM bookmarks b
      LEFT JOIN categories c ON c.id = b.category_id
      JOIN json_each(COALESCE(b.tags, '[]')) jt
      WHERE ${statusSql}
        AND ${navVisibilitySql}
        AND (b.category_id IS NULL OR ${catVisibilitySql})
        AND trim(COALESCE(jt.value, '')) != ''
    `;

    const [listRs, countRs] = await Promise.all([
      c.env.DB
        .prepare(
          `SELECT lower(trim(jt.value)) AS id, trim(jt.value) AS name, COUNT(1) AS count
           ${baseFrom}
           GROUP BY lower(trim(jt.value))
           ORDER BY count DESC, name ASC
           LIMIT ? OFFSET ?`
        )
        .bind(pageSize, offset)
        .all<any>(),
      c.env.DB
        .prepare(
          `SELECT COUNT(1) AS cnt
           FROM (
             SELECT lower(trim(jt.value))
             ${baseFrom}
             GROUP BY lower(trim(jt.value))
           )`
        )
        .all<any>(),
    ]);

    const total = Number(countRs.results?.[0]?.cnt || 0);
    const data = (listRs.results || []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      count: Number(row.count || 0),
    }));

    return c.json(responses.ok({ data, total, pageNumber: Math.ceil(total / pageSize) }));
  } catch (err) {
    console.error('Worker tag list error:', err);
    return c.json(responses.serverError(), 500);
  }
});
