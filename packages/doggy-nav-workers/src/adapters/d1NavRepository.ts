import type { NavRepository, NavListOptions } from 'doggy-nav-core';
import type { PageResult } from 'doggy-nav-core';
import type { NavItem } from 'doggy-nav-core';

export default class D1NavRepository implements NavRepository {
  constructor(private readonly db: D1Database) {}

  async list(options: NavListOptions): Promise<PageResult<NavItem>> {
    const { page, filter } = options;
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const where: string[] = [];
    const params: any[] = [];

    if (filter?.status !== undefined) {
      where.push('b.status = ?');
      params.push(filter.status);
    }
    if (filter?.categoryId) {
      where.push('b.category_id = ?');
      params.push(filter.categoryId);
    }
    if (filter?.name) {
      where.push('b.name LIKE ?');
      params.push(`%${filter.name}%`);
    }

    const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const baseSelect = `SELECT b.*, c.name AS category_name
                        FROM bookmarks b
                        LEFT JOIN categories c ON c.id = b.category_id
                        ${whereSql}
                        ORDER BY b.created_at DESC
                        LIMIT ? OFFSET ?`;

    const countSql = `SELECT COUNT(*) AS cnt FROM bookmarks b ${whereSql}`;

    const listRs = await this.db.prepare(baseSelect).bind(...params, pageSize, offset).all<any>();
    const countRs = await this.db.prepare(countSql).bind(...params).all<any>();

    const total = (countRs.results?.[0]?.cnt as number) || 0;
    const rows: any[] = listRs.results || [];

    const data: NavItem[] = rows.map((r) => ({
      id: String(r.id),
      categoryId: r.category_id ? String(r.category_id) : null,
      name: String(r.name),
      href: r.href ?? null,
      desc: r.description ?? null,
      detail: r.detail ?? null,
      logo: r.logo ?? null,
      authorName: r.author_name ?? null,
      authorUrl: r.author_url ?? null,
      auditTime: r.audit_time ?? null,
      createTime: r.create_time ? Number(r.create_time) : null,
      tags: (() => { try { return JSON.parse(r.tags || '[]'); } catch { return []; } })(),
      view: typeof r.view_count === 'number' ? r.view_count : undefined,
      star: typeof r.star_count === 'number' ? r.star_count : undefined,
      status: typeof r.status === 'number' ? r.status : undefined,
      categoryName: r.category_name ?? null,
      audience: { visibility: (r.audience_visibility as any) || 'public' },
    }));

    return { data, total, pageNumber: Math.ceil(total / pageSize) };
  }
}
