import type { FavoriteCommandRepository } from 'doggy-nav-core';

export class MongooseFavoriteCommandRepository implements FavoriteCommandRepository {
  constructor(private readonly ctx: any) {}

  private get fav() { return this.ctx.model.Favorite; }

  async addFavorite(userId: string, navId: string) {
    const existing = await this.fav.findOne({ userId, navId }).lean();
    if (existing) {
      throw new Error('已经收藏过了');
    }
    const created = await this.fav.create({ userId, navId });
    return { id: created._id?.toString?.() ?? created.id, userId: String(userId), navId: String(navId) };
  }

  async removeFavorite(userId: string, navId: string) {
    const res = await this.fav.deleteOne({ userId, navId });
    return { ok: (res as any).deletedCount > 0 };
  }
}

export default MongooseFavoriteCommandRepository;
