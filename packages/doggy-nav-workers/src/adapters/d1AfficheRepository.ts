import type { AfficheRepository, PageQuery, PageResult, Affiche } from 'doggy-nav-core';
import { newId24 } from '../utils/id';

function rowToAffiche(row: any): Affiche {
  return {
    id: String(row.id),
    text: String(row.text ?? ''),
    linkHref: row.link_href ?? null,
    linkText: row.link_text ?? null,
    linkTarget: row.link_target ?? null,
    active: Number(row.active ?? 0) === 1,
    order: row.sort_order !== undefined && row.sort_order !== null ? Number(row.sort_order) : null,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export default class D1AfficheRepository implements AfficheRepository {
  constructor(private readonly db: D1Database) {}

  async list(page: PageQuery, filter?: { active?: boolean }): Promise<PageResult<Affiche>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const conds: string[] = [];
    const params: any[] = [];
    if (typeof filter?.active === 'boolean') {
      conds.push('active = ?');
      params.push(filter.active ? 1 : 0);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const listRs = await this.db
      .prepare(
        `SELECT id, text, link_href, link_text, link_target, active, sort_order, created_at, updated_at
         FROM affiches ${where}
         ORDER BY sort_order ASC, created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...params, pageSize, offset)
      .all<any>();
    const countRs = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM affiches ${where}`)
      .bind(...params)
      .all<any>();

    const total = Number((countRs.results?.[0]?.cnt as number) || 0);
    const rows: any[] = listRs.results || [];
    return {
      data: rows.map(rowToAffiche),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<Affiche | null> {
    const row = await this.db
      .prepare(
        `SELECT id, text, link_href, link_text, link_target, active, sort_order, created_at, updated_at
         FROM affiches WHERE id = ? LIMIT 1`
      )
      .bind(id)
      .first<any>();
    return row ? rowToAffiche(row) : null;
  }

  async create(input: {
    text: string;
    linkHref?: string | null;
    linkText?: string | null;
    linkTarget?: string | null;
    active?: boolean;
    order?: number | null;
  }): Promise<Affiche> {
    const id = newId24();
    const active = input.active !== undefined ? (input.active ? 1 : 0) : 1;
    const sortOrder = input.order ?? 0;

    await this.db
      .prepare(
        `INSERT INTO affiches (id, text, link_href, link_text, link_target, active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`
      )
      .bind(
        id,
        input.text,
        input.linkHref ?? null,
        input.linkText ?? null,
        input.linkTarget ?? null,
        active,
        sortOrder
      )
      .run();

    return (await this.getById(id))!;
  }

  async update(
    id: string,
    input: {
      text?: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    }
  ): Promise<Affiche | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const text = input.text ?? current.text;
    const linkHref = input.linkHref !== undefined ? input.linkHref : current.linkHref ?? null;
    const linkText = input.linkText !== undefined ? input.linkText : current.linkText ?? null;
    const linkTarget =
      input.linkTarget !== undefined ? input.linkTarget : current.linkTarget ?? null;
    const active =
      input.active === undefined ? (current.active ? 1 : 0) : input.active ? 1 : 0;
    const sortOrder = input.order !== undefined ? input.order : current.order ?? 0;

    await this.db
      .prepare(
        `UPDATE affiches
         SET text = ?, link_href = ?, link_text = ?, link_target = ?, active = ?, sort_order = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = ?`
      )
      .bind(text, linkHref, linkText, linkTarget, active, sortOrder, id)
      .run();

    return this.getById(id);
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.db
      .prepare(`DELETE FROM affiches WHERE id = ?`)
      .bind(id)
      .run();
    return (res.meta?.rows_written ?? 0) > 0;
  }

  async listActive(): Promise<Affiche[]> {
    const rs = await this.db
      .prepare(
        `SELECT id, text, link_href, link_text, link_target, active, sort_order, created_at, updated_at
         FROM affiches WHERE active = 1
         ORDER BY sort_order ASC, created_at DESC`
      )
      .all<any>();
    const rows: any[] = rs.results || [];
    return rows.map(rowToAffiche);
  }
}
