import type {
  FavoriteFolderRepository,
  CreateFolderInput,
  UpdateFolderInput,
  PlacementsInput,
} from 'doggy-nav-core';
import type { FavoriteFolder } from 'doggy-nav-core';

export default class D1FavoriteFolderRepository implements FavoriteFolderRepository {
  constructor(private readonly db: D1Database) {}

  async createFolder(userId: string, input: CreateFolderInput): Promise<FavoriteFolder> {
    const id =
      (globalThis.crypto?.randomUUID?.() as string) ||
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const name = String(input.name);
    await this.db
      .prepare(`INSERT INTO favorite_folders (id, user_id, name) VALUES (?, ?, ?)`)
      .bind(id, userId, name)
      .run();
    // Move items into folder by setting folder_name on favorites
    if (Array.isArray(input.navIds) && input.navIds.length > 0) {
      const stmt = this.db.prepare(
        `UPDATE favorites SET folder_name = ? WHERE user_id = ? AND bookmark_id = ?`
      );
      for (const navId of input.navIds) {
        await stmt.bind(name, userId, navId).run();
      }
    }
    return { id, name, order: null, coverNavId: null };
  }

  async updateFolder(
    userId: string,
    id: string,
    input: UpdateFolderInput
  ): Promise<{ id: string; name?: string; order?: number | null }> {
    const row = await this.db
      .prepare(`SELECT name FROM favorite_folders WHERE id = ? AND user_id = ? LIMIT 1`)
      .bind(id, userId)
      .first<any>();
    if (!row) return { id };
    const oldName = String(row.name);
    const update: any = {};
    if (typeof input.name === 'string') {
      await this.db
        .prepare(`UPDATE favorite_folders SET name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?`)
        .bind(input.name, id, userId)
        .run();
      // Propagate rename to favorites.folder_name
      await this.db
        .prepare(`UPDATE favorites SET folder_name = ? WHERE user_id = ? AND folder_name = ?`)
        .bind(input.name, userId, oldName)
        .run();
      update.name = input.name;
    }
    // Membership adjustments
    if (Array.isArray(input.addNavIds) && input.addNavIds.length > 0) {
      const stmt = this.db.prepare(
        `UPDATE favorites SET folder_name = ? WHERE user_id = ? AND bookmark_id = ?`
      );
      for (const navId of input.addNavIds) {
        await stmt.bind(update.name || oldName, userId, navId).run();
      }
    }
    if (Array.isArray(input.removeNavIds) && input.removeNavIds.length > 0) {
      const stmt = this.db.prepare(
        `UPDATE favorites SET folder_name = '' WHERE user_id = ? AND bookmark_id = ?`
      );
      for (const navId of input.removeNavIds) {
        await stmt.bind(userId, navId).run();
      }
    }
    return { id, ...update };
  }

  async deleteFolder(userId: string, id: string): Promise<{ id: string }> {
    const row = await this.db
      .prepare(`SELECT name FROM favorite_folders WHERE id = ? AND user_id = ? LIMIT 1`)
      .bind(id, userId)
      .first<any>();
    if (row) {
      await this.db
        .prepare(`UPDATE favorites SET folder_name = '' WHERE user_id = ? AND folder_name = ?`)
        .bind(userId, String(row.name))
        .run();
    }
    await this.db
      .prepare(`DELETE FROM favorite_folders WHERE id = ? AND user_id = ?`)
      .bind(id, userId)
      .run();
    return { id };
  }

  async placements(userId: string, _input: PlacementsInput): Promise<{ ok: boolean }> {
    // Current D1 schema doesn't track ordering; accept and no-op for compat
    return { ok: true };
  }
}
