import type { FavoriteRepository } from 'doggy-nav-core';
import type { PageQuery, PageResult } from 'doggy-nav-core';
import type { NavItem, FavoriteUnionItem } from 'doggy-nav-core';

export default class D1FavoriteRepository implements FavoriteRepository {
  constructor(private readonly db: D1Database) {}

  async list(userId: string, page: PageQuery): Promise<PageResult<NavItem>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const offset = (pageNumber - 1) * pageSize;

    const listRs = await this.db
      .prepare(
        `SELECT b.* FROM favorites f JOIN bookmarks b ON b.id = f.bookmark_id
        WHERE f.user_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?`
      )
      .bind(userId, pageSize, offset)
      .all<any>();
    const countRs = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM favorites WHERE user_id = ?`)
      .bind(userId)
      .all<any>();

    const total = Number((countRs.results?.[0]?.cnt as number) || 0);
    const rows: any[] = listRs.results || [];
    const data: NavItem[] = rows.map(rowToNavItem);
    return { data, total, pageNumber: Math.ceil(total / pageSize) };
  }

  async check(userId: string, navId: string): Promise<boolean> {
    const row = await this.db
      .prepare(`SELECT 1 as x FROM favorites WHERE user_id = ? AND bookmark_id = ? LIMIT 1`)
      .bind(userId, navId)
      .first<any>();
    return !!row;
  }

  async count(userId: string): Promise<number> {
    const row = await this.db
      .prepare(`SELECT COUNT(1) as cnt FROM favorites WHERE user_id = ?`)
      .bind(userId)
      .first<any>();
    return Number(row?.cnt || 0);
  }

  async structured(userId: string): Promise<FavoriteUnionItem[]> {
    // Folders
    const foldersRs = await this.db
      .prepare(`SELECT id, name FROM favorite_folders WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(userId)
      .all<any>();
    const folderRows: any[] = foldersRs.results || [];

    const out: FavoriteUnionItem[] = [];
    for (const f of folderRows) {
      const itemsRs = await this.db
        .prepare(
          `SELECT b.* FROM favorites fav JOIN bookmarks b ON b.id = fav.bookmark_id
           WHERE fav.user_id = ? AND fav.folder_name = ? ORDER BY fav.created_at DESC`
        )
        .bind(userId, f.name)
        .all<any>();
      const items: NavItem[] = (itemsRs.results || []).map(rowToNavItem);
      out.push({ type: 'folder', order: null, folder: { id: String(f.id), name: String(f.name), order: null, coverNavId: null }, items });
    }

    // Root items (no folder)
    const rootRs = await this.db
      .prepare(
        `SELECT b.* FROM favorites f JOIN bookmarks b ON b.id = f.bookmark_id
        WHERE f.user_id = ? AND (f.folder_name IS NULL OR f.folder_name = '') ORDER BY f.created_at DESC`
      )
      .bind(userId)
      .all<any>();
    const rootRows: any[] = rootRs.results || [];
    for (const r of rootRows) out.push({ type: 'nav', order: null, nav: rowToNavItem(r) });

    return out;
  }
}

function rowToNavItem(r: any): NavItem {
  return {
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
        return [];
      }
    })(),
    view: typeof r.view_count === 'number' ? r.view_count : undefined,
    star: typeof r.star_count === 'number' ? r.star_count : undefined,
    status: typeof r.status === 'number' ? r.status : undefined,
    categoryName: null,
    audience: { visibility: (r.audience_visibility as any) || 'public' },
  };
}
