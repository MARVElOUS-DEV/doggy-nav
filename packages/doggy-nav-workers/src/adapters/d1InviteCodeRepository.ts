import type {
  InviteCodeRepository,
  InviteCodeListOptions,
  InviteCodeCreateItem,
  InviteCodeUpdatePatch,
} from 'doggy-nav-core';
import type { InviteCode } from 'doggy-nav-core';

function rowToInviteCode(row: any): InviteCode {
  return {
    id: String(row.id),
    code: row.code,
    usageLimit: Number(row.usage_limit ?? 1),
    usedCount: Number(row.used_count ?? 0),
    active: row.active !== 0,
    expiresAt: row.expires_at ?? null,
    allowedEmailDomain: row.allowed_email_domain ?? null,
    createdBy: row.created_by ?? null,
    lastUsedAt: row.used_at ?? null,
    lastUsedBy: row.used_by ?? null,
    note: row.note ?? null,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export default class D1InviteCodeRepository implements InviteCodeRepository {
  constructor(private readonly db: D1Database) {}

  async list(options: InviteCodeListOptions) {
    const { page, filter } = options;
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const conds: string[] = [];
    const params: any[] = [];
    if (filter?.active !== undefined) {
      conds.push('active = ?');
      params.push(filter.active ? 1 : 0);
    }
    if (filter?.codeSearch) {
      conds.push('code LIKE ?');
      params.push(`%${filter.codeSearch}%`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const listRs = await this.db
      .prepare(`SELECT * FROM invite_codes ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .bind(...params, pageSize, offset)
      .all<any>();
    const countRs = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM invite_codes ${where}`)
      .bind(...params)
      .all<any>();

    const total = Number((countRs.results?.[0]?.cnt as number) || 0);
    const rows: any[] = listRs.results || [];
    return { data: rows.map(rowToInviteCode), total, pageNumber: Math.ceil(total / pageSize) };
  }

  async createBulk(items: InviteCodeCreateItem[]): Promise<InviteCode[]> {
    const stmt = this.db.prepare(
      `INSERT INTO invite_codes (id, code, usage_limit, used_count, active, allowed_email_domain, note, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const created: InviteCode[] = [];
    for (const it of items) {
      const id = (globalThis.crypto?.randomUUID?.() as string) || cryptoRandomId();
      await stmt
        .bind(
          id,
          it.code,
          it.usageLimit ?? 1,
          0,
          1,
          it.allowedEmailDomain ?? null,
          it.note ?? null,
          it.createdBy ?? null,
          it.expiresAt ?? null
        )
        .run();
      const row = await this.getById(id);
      if (row) created.push(row);
    }
    return created;
  }

  async getById(id: string): Promise<InviteCode | null> {
    const row = await this.db
      .prepare(`SELECT * FROM invite_codes WHERE id = ? LIMIT 1`)
      .bind(id)
      .first<any>();
    return row ? rowToInviteCode(row) : null;
  }

  async update(id: string, patch: InviteCodeUpdatePatch): Promise<InviteCode | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (patch.active !== undefined) { fields.push('active = ?'); params.push(patch.active ? 1 : 0); }
    if (patch.usageLimit !== undefined) { fields.push('usage_limit = ?'); params.push(patch.usageLimit); }
    if (patch.expiresAt !== undefined) { fields.push('expires_at = ?'); params.push(patch.expiresAt ?? null); }
    if (patch.note !== undefined) { fields.push('note = ?'); params.push(patch.note ?? null); }
    if (patch.allowedEmailDomain !== undefined) { fields.push('allowed_email_domain = ?'); params.push(patch.allowedEmailDomain ?? null); }
    if (!fields.length) return this.getById(id);
    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')");
    await this.db.prepare(`UPDATE invite_codes SET ${fields.join(', ')} WHERE id = ?`).bind(...params, id).run();
    return this.getById(id);
  }
}

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
