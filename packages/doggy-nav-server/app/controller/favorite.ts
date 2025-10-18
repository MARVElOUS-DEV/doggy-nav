import { PipelineStage, Types } from 'mongoose';
import Controller from '../core/base_controller';

export default class FavoriteController extends Controller {
  tableName(): string {
    return 'Favorite';
  }

  /**
   * Add a nav item to user's favorites
   */
  async add() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedBody();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      // Check if nav item exists
      const navItem = await ctx.model.Nav.findById(navId);
      if (!navItem) {
        this.error('网站不存在');
        return;
      }

      // Check if already favorited
      const existingFavorite = await ctx.model.Favorite.findOne({
        userId: userInfo.userId,
        navId,
      });

      if (existingFavorite) {
        this.error('已经收藏过了');
        return;
      }

      // Create favorite
      const favorite = await ctx.model.Favorite.create({
        userId: userInfo.userId,
        navId,
      });

      this.success(favorite);
    } catch (error: any) {
      console.error('Add favorite error:', error);
      this.error(error.message || '收藏失败');
    }
  }

  /**
   * Get user's favorites in structured form: union of root items and folders (with items)
   */
  async structured() {
    const { ctx } = this;

    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();

    try {
      // Root-level favorites (no folder)
      const rootPipeline: PipelineStage[] = [
        { $match: { userId: new Types.ObjectId(userInfo.userId), parentFolderId: null } },
        { $lookup: { from: 'nav', localField: 'navId', foreignField: '_id', as: 'navItem' } },
        { $unwind: '$navItem' },
        // Convert string categoryId to ObjectId for proper lookup
        { $addFields: { categoryObjectId: { $cond: [ { $regexMatch: { input: '$navItem.categoryId', regex: /^[a-fA-F0-9]{24}$/ } }, { $toObjectId: '$navItem.categoryId' }, null ] } } },
        { $lookup: { from: 'category', localField: 'categoryObjectId', foreignField: '_id', as: 'category', pipeline: [ { $project: { name: 1 } } ] } },
        { $addFields: { 'navItem.categoryName': { $ifNull: [ { $arrayElemAt: [ '$category.name', 0 ] }, null ] } } },
        { $project: { _id: 1, userId: 1, navId: 1, order: 1, parentFolderId: 1, navItem: { _id: '$navItem._id', name: '$navItem.name', href: '$navItem.href', desc: '$navItem.desc', logo: '$navItem.logo', authorName: '$navItem.authorName', authorUrl: '$navItem.authorUrl', categoryId: '$navItem.categoryId', categoryName: '$navItem.categoryName', tags: '$navItem.tags', view: '$navItem.view', star: '$navItem.star', status: '$navItem.status', hide: '$navItem.hide', createTime: '$navItem.createTime', auditTime: '$navItem.auditTime' } } },
        { $sort: { order: 1, createdAt: -1 } },
      ];

      const folders = await ctx.model.FavoriteFolder.find({ userId: userInfo.userId }).sort({ order: 1, createdAt: -1 }).lean();

      const rootFavorites = await ctx.model.Favorite.aggregate(rootPipeline);

      // Fetch items per folder
      const folderIds = folders.map((f: any) => f._id);
      let folderItemsById: Record<string, any[]> = {};
      if (folderIds.length > 0) {
        const folderItems = await ctx.model.Favorite.aggregate([
          { $match: { userId: new Types.ObjectId(userInfo.userId), parentFolderId: { $in: folderIds.map((id: any) => new Types.ObjectId(id)) } } },
          { $lookup: { from: 'nav', localField: 'navId', foreignField: '_id', as: 'navItem' } },
          { $unwind: '$navItem' },
          { $addFields: { categoryObjectId: { $cond: [ { $regexMatch: { input: '$navItem.categoryId', regex: /^[a-fA-F0-9]{24}$/ } }, { $toObjectId: '$navItem.categoryId' }, null ] } } },
          { $lookup: { from: 'category', localField: 'categoryObjectId', foreignField: '_id', as: 'category', pipeline: [ { $project: { name: 1 } } ] } },
          { $addFields: { 'navItem.categoryName': { $ifNull: [ { $arrayElemAt: [ '$category.name', 0 ] }, null ] } } },
          { $project: { _id: 1, userId: 1, navId: 1, parentFolderId: 1, order: 1, navItem: { _id: '$navItem._id', name: '$navItem.name', href: '$navItem.href', desc: '$navItem.desc', logo: '$navItem.logo', authorName: '$navItem.authorName', authorUrl: '$navItem.authorUrl', categoryId: '$navItem.categoryId', categoryName: '$navItem.categoryName', tags: '$navItem.tags', view: '$navItem.view', star: '$navItem.star', status: '$navItem.status', hide: '$navItem.hide', createTime: '$navItem.createTime', auditTime: '$navItem.auditTime' } } },
          { $sort: { order: 1, createdAt: -1 } },
        ]);

        folderItemsById = folderItems.reduce((acc: any, cur: any) => {
          const key = String(cur.parentFolderId);
          if (!acc[key]) acc[key] = [];
          acc[key].push({ ...cur.navItem, isFavorite: true });
          return acc;
        }, {});
      }

      const foldersUnion = folders.map((f: any) => ({
        type: 'folder',
        order: f.order ?? 0,
        folder: {
          id: String(f._id),
          name: f.name,
          order: f.order ?? 0,
          coverNavId: f.coverNavId ? String(f.coverNavId) : null,
        },
        items: folderItemsById[String(f._id)] || [],
      }));

      const rootUnion = rootFavorites.map((fav: any) => ({
        type: 'nav',
        order: fav.order ?? 0,
        nav: { ...fav.navItem, isFavorite: true },
      }));

      const union = [...foldersUnion, ...rootUnion].sort((a, b) => (a.order || 0) - (b.order || 0));

      this.success({ data: union });
    } catch (error: any) {
      console.error('Get structured favorites error:', error);
      this.error(error.message || '获取收藏结构失败');
    }
  }

  /**
   * Create a folder and optionally move items into it
   */
  async createFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { name, navIds = [], order } = this.getSanitizedBody();
    if (!name) {
      this.error('name is required');
      return;
    }
    try {
      const folderDoc = await ctx.model.FavoriteFolder.create({ userId: userInfo.userId, name, order: order ?? Date.now() });
      if (navIds.length > 0) {
        await ctx.model.Favorite.updateMany(
          { userId: userInfo.userId, navId: { $in: navIds } },
          { $set: { parentFolderId: folderDoc._id } },
        );
      }
      this.success(folderDoc.toJSON ? folderDoc.toJSON() : folderDoc);
    } catch (error: any) {
      console.error('Create favorite folder error:', error);
      this.error(error.message || '创建文件夹失败');
    }
  }

  /**
   * Update folder (rename, membership, order)
   */
  async updateFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { id } = ctx.params;
    const { name, addNavIds = [], removeNavIds = [], order } = this.getSanitizedBody();
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      const update: any = {};
      if (typeof name === 'string') update.name = name;
      if (typeof order === 'number') update.order = order;
      if (Object.keys(update).length > 0) {
        await ctx.model.FavoriteFolder.updateOne({ _id: id, userId: userInfo.userId }, update);
      }
      if (addNavIds.length > 0) {
        await ctx.model.Favorite.updateMany({ userId: userInfo.userId, navId: { $in: addNavIds } }, { $set: { parentFolderId: id } });
      }
      if (removeNavIds.length > 0) {
        await ctx.model.Favorite.updateMany({ userId: userInfo.userId, navId: { $in: removeNavIds } }, { $set: { parentFolderId: null } });
      }
      this.success({ id, ...update });
    } catch (error: any) {
      console.error('Update favorite folder error:', error);
      this.error(error.message || '更新文件夹失败');
    }
  }

  /**
   * Delete folder; move items to root
   */
  async deleteFolder() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { id } = ctx.params;
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      await ctx.model.Favorite.updateMany({ userId: userInfo.userId, parentFolderId: id }, { $set: { parentFolderId: null } });
      await ctx.model.FavoriteFolder.deleteOne({ _id: id, userId: userInfo.userId });
      this.success({ id });
    } catch (error: any) {
      console.error('Delete favorite folder error:', error);
      this.error(error.message || '删除文件夹失败');
    }
  }

  /**
   * Bulk placements: reorder/move items and folders
   */
  async placements() {
    const { ctx } = this;
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }
    const userInfo = this.getUserInfo();
    const { root = [], folders = [], moves = [] } = this.getSanitizedBody();

    try {
      // Reorder root navs
      for (const r of root) {
        if (!r.navId) continue;
        await ctx.model.Favorite.updateOne({ userId: userInfo.userId, navId: r.navId }, { $set: { order: r.order, parentFolderId: null } });
      }
      // Reorder folders
      for (const f of folders) {
        if (!f.folderId) continue;
        await ctx.model.FavoriteFolder.updateOne({ _id: f.folderId, userId: userInfo.userId }, { $set: { order: f.order } });
      }
      // Moves (into folders/out of folders)
      for (const m of moves) {
        if (!m.navId) continue;
        await ctx.model.Favorite.updateOne({ userId: userInfo.userId, navId: m.navId }, { $set: { order: m.order, parentFolderId: m.parentFolderId || null } });
      }
      this.success({ ok: true });
    } catch (error: any) {
      console.error('Update placements error:', error);
      this.error(error.message || '更新排序失败');
    }
  }

  /**
   * Remove a nav item from user's favorites
   */
  async remove() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedQuery();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      // Find and remove favorite
      const result = await ctx.model.Favorite.deleteOne({
        userId: userInfo.userId,
        navId,
      });

      if (result.deletedCount === 0) {
        this.error('收藏不存在');
        return;
      }

      this.success({ message: '取消收藏成功' });
    } catch (error: any) {
      console.error('Remove favorite error:', error);
      this.error(error.message || '取消收藏失败');
    }
  }

  /**
   * Get user's favorite list with nav item details
   */
  async list() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.error('请先登录');
      return;
    }

    const userInfo = this.getUserInfo();
    const query = this.getSanitizedQuery();

    try {
      let { pageSize = 10, pageNumber = 1 } = query;
      pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
      pageNumber = Math.max(Number(pageNumber) || 1, 1);
      const skipNumber = pageSize * pageNumber - pageSize;

      // Get favorites with nav item details
      const pipeline: PipelineStage[] = [
        {
          $match: {
            userId: new Types.ObjectId(userInfo.userId),
          },
        },
        {
          $lookup: {
            from: 'nav',
            localField: 'navId',
            foreignField: '_id',
            as: 'navItem',
          },
        },
        {
          $unwind: '$navItem',
        },
        // Ensure categoryId string is converted to ObjectId for lookup
        {
          $addFields: {
            categoryObjectId: {
              $cond: [
                { $regexMatch: { input: '$navItem.categoryId', regex: /^[a-fA-F0-9]{24}$/ } },
                { $toObjectId: '$navItem.categoryId' },
                null,
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'category',
            localField: 'categoryObjectId',
            foreignField: '_id',
            as: 'category',
            pipeline: [
              {
                $project: {
                  name: 1,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            'navItem.categoryName': {
              $ifNull: [{ $arrayElemAt: [ '$category.name', 0 ] }, null ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            navId: 1,
            createdAt: 1,
            updatedAt: 1,
            navItem: {
              _id: '$navItem._id',
              name: '$navItem.name',
              href: '$navItem.href',
              desc: '$navItem.desc',
              logo: '$navItem.logo',
              authorName: '$navItem.authorName',
              authorUrl: '$navItem.authorUrl',
              categoryId: '$navItem.categoryId',
              categoryName: '$navItem.categoryName',
              tags: '$navItem.tags',
              view: '$navItem.view',
              star: '$navItem.star',
              status: '$navItem.status',
              hide: '$navItem.hide',
              createTime: '$navItem.createTime',
              auditTime: '$navItem.auditTime',
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skipNumber,
        },
        {
          $limit: pageSize,
        },
      ];

      const countPipeline = [
        {
          $match: {
            userId: new Types.ObjectId(userInfo.userId),
          },
        },
        {
          $count: 'total',
        },
      ];

      const [ favorites, countResult ] = await Promise.all([
        ctx.model.Favorite.aggregate(pipeline),
        ctx.model.Favorite.aggregate(countPipeline),
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Extract nav items from favorites
      const navItems = favorites.map(fav => ({
        ...fav.navItem,
        isFavorite: true, // Mark as favorite since they're from favorites list
      }));

      this.success({
        data: navItems,
        total,
        pageNumber: Math.ceil(total / pageSize),
      });
    } catch (error: any) {
      console.error('Get favorites list error:', error);
      this.error(error.message || '获取收藏列表失败');
    }
  }

  /**
   * Check if a nav item is favorited by current user
   */
  async check() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.success({ isFavorite: false });
      return;
    }

    const userInfo = this.getUserInfo();
    const { navId } = this.getSanitizedQuery();

    if (!navId) {
      this.error('navId is required');
      return;
    }

    try {
      const favorite = await ctx.model.Favorite.findOne({
        userId: userInfo.userId,
        navId,
      });

      this.success({ isFavorite: !!favorite });
    } catch (error: any) {
      console.error('Check favorite error:', error);
      this.error(error.message || '检查收藏状态失败');
    }
  }

  /**
   * Get user's favorite count
   */
  async count() {
    const { ctx } = this;

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.success({ count: 0 });
      return;
    }

    const userInfo = this.getUserInfo();

    try {
      const count = await ctx.model.Favorite.countDocuments({
        userId: userInfo.userId,
      });

      this.success({ count });
    } catch (error: any) {
      console.error('Get favorite count error:', error);
      this.error(error.message || '获取收藏数量失败');
    }
  }
}
