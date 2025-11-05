import type { FavoriteCommandRepository } from 'doggy-nav-core';
import { newId24 } from '../utils/id';

export default class D1FavoriteCommandRepository implements FavoriteCommandRepository {
  constructor(private readonly db: D1Database) {}

  async addFavorite(
    userId: string,
    navId: string
  ): Promise<{ id: string; userId: string; navId: string }> {
    const id = newId24();
    await this.db
      .prepare(`INSERT OR IGNORE INTO favorites (id, user_id, bookmark_id) VALUES (?, ?, ?)`)
      .bind(id, userId, navId)
      .run();
    return { id, userId, navId };
  }

  async removeFavorite(userId: string, navId: string): Promise<{ ok: boolean }> {
    const res = await this.db
      .prepare(`DELETE FROM favorites WHERE user_id = ? AND bookmark_id = ?`)
      .bind(userId, navId)
      .run();
    return { ok: (res.meta?.rows_written ?? 0) > 0 };
  }
}
