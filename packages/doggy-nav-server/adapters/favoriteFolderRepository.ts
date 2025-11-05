import type { FavoriteFolderRepository, CreateFolderInput, UpdateFolderInput, PlacementsInput } from 'doggy-nav-core';
import type { FavoriteFolder } from 'doggy-nav-core';

export class MongooseFavoriteFolderRepository implements FavoriteFolderRepository {
  constructor(private readonly ctx: any) {}
  private get fav() { return this.ctx.model.Favorite; }
  private get folder() { return this.ctx.model.FavoriteFolder; }

  async createFolder(userId: string, input: CreateFolderInput): Promise<FavoriteFolder> {
    const doc = await this.folder.create({ userId, name: input.name, order: input.order ?? Date.now() });
    if (Array.isArray(input.navIds) && input.navIds.length > 0) {
      await this.fav.updateMany({ userId, navId: { $in: input.navIds } }, { $set: { parentFolderId: doc._id } });
    }
    return { id: doc._id?.toString?.(), name: doc.name, order: doc.order ?? null, coverNavId: doc.coverNavId ? String(doc.coverNavId) : null };
  }

  async updateFolder(userId: string, id: string, input: UpdateFolderInput): Promise<{ id: string; name?: string; order?: number | null; }> {
    const update: any = {};
    if (typeof input.name === 'string') update.name = input.name;
    if (typeof input.order === 'number' || input.order === null) update.order = input.order;
    if (Object.keys(update).length > 0) await this.folder.updateOne({ _id: id, userId }, update);
    if (Array.isArray(input.addNavIds) && input.addNavIds.length > 0) {
      await this.fav.updateMany({ userId, navId: { $in: input.addNavIds } }, { $set: { parentFolderId: id } });
    }
    if (Array.isArray(input.removeNavIds) && input.removeNavIds.length > 0) {
      await this.fav.updateMany({ userId, navId: { $in: input.removeNavIds } }, { $set: { parentFolderId: null } });
    }
    return { id, ...update };
  }

  async deleteFolder(userId: string, id: string): Promise<{ id: string; }> {
    await this.fav.updateMany({ userId, parentFolderId: id }, { $set: { parentFolderId: null } });
    await this.folder.deleteOne({ _id: id, userId });
    return { id };
  }

  async placements(userId: string, input: PlacementsInput): Promise<{ ok: boolean; }> {
    for (const r of input.root || []) {
      if (!r.navId) continue;
      await this.fav.updateOne({ userId, navId: r.navId }, { $set: { order: r.order ?? null, parentFolderId: null } });
    }
    for (const f of input.folders || []) {
      if (!f.folderId) continue;
      await this.folder.updateOne({ _id: f.folderId, userId }, { $set: { order: f.order ?? null } });
    }
    for (const m of input.moves || []) {
      if (!m.navId) continue;
      await this.fav.updateOne({ userId, navId: m.navId }, { $set: { order: m.order ?? null, parentFolderId: m.parentFolderId || null } });
    }
    return { ok: true };
  }
}

export default MongooseFavoriteFolderRepository;
