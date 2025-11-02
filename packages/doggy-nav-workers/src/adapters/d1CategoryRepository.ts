import type { CategoryRepository, CategoryListOptions, Category } from 'doggy-nav-core';

export default class D1CategoryRepository implements CategoryRepository {
  constructor(private readonly db: D1Database) {}

  async listAll(options?: CategoryListOptions): Promise<Category[]> {
    const showInMenu = options?.showInMenu;
    const where: string[] = [];
    const params: any[] = [];
    if (showInMenu !== undefined) {
      where.push('show_in_menu = ?');
      params.push(showInMenu ? 1 : 0);
    }
    const sql = `SELECT id, name, category_id, description, only_folder, icon, show_in_menu, audience_visibility
                 FROM categories ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
    const rs = await this.db.prepare(sql).bind(...params).all<any>();
    const rows: any[] = rs.results || [];
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      categoryId: r.category_id ? String(r.category_id) : null,
      description: r.description ?? null,
      onlyFolder: r.only_folder ? !!r.only_folder : false,
      icon: r.icon ?? null,
      showInMenu: r.show_in_menu ? !!r.show_in_menu : false,
      audience: { visibility: (r.audience_visibility as any) || 'public' },
    }));
  }
}
