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
        {
          $lookup: {
            from: 'category',
            localField: 'navItem.categoryId',
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
