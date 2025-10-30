import { PipelineStage, Types } from 'mongoose';
import { parseHTML } from '../../utils/reptileHelper';
import { nowToChromeTime } from '../../utils/timeUtil';
import Controller from '../core/base_controller';
import type { AuthUserContext } from '../../types/rbac';
import { buildAudienceFilterEx } from '../utils/audience';

enum NAV_STATUS {
  pass,
  wait,
  refuse,
}

export default class NavController extends Controller {
  tableName(): string {
    return 'Nav';
  }

  async list() {
    const { ctx } = this;
    const { status = 0, categoryId, name } = ctx.query;

    let findParam: any = {};

    const isAuthenticated = this.isAuthenticated();

    // Handle status filter
    if (isAuthenticated) {
      // Authenticated users can filter by status
      if (status !== undefined && status !== '') {
        findParam.status = Number(status);
      } else {
        // Default for authenticated users: show approved or legacy items without status
        findParam = {
          $or: [{ status: { $exists: false } }, { status: 0 }],
        };
      }
    } else {
      // Non-authenticated users can only see approved items
      findParam.status = NAV_STATUS.pass;
    }

    // Audience-based visibility is handled below; legacy `hide` is no longer used for filtering

    if (categoryId) {
      findParam.categoryId = {
        $eq: categoryId,
      };
    }
    if (name) {
      const reg = new RegExp(name, 'i');
      findParam.name = {
        $regex: reg,
      };
    }

    // Audience filtering (+ legacy hide compatibility)
    const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
    findParam = buildAudienceFilterEx(findParam, userCtx);

    // Enforce category audience rules when a nav item is linked to a category
    // Navs without a category continue to use only the nav item's own rules
    try {
      const allowedCategoryFilter = buildAudienceFilterEx({}, userCtx);
      const allowedCategories = await ctx.model.Category.find(allowedCategoryFilter).select('_id');
      const allowedCategoryIds = allowedCategories.map((c: any) => c._id.toString());

      const categoryVisibilityOr = [{ categoryId: { $in: allowedCategoryIds } }];

      findParam = { $and: [findParam, { $or: categoryVisibilityOr }] };
    } catch {
      // If category visibility evaluation fails, fall back to nav-only filtering
      // to avoid breaking the endpoint
    }

    // If user is authenticated, include favorite status
    if (isAuthenticated) {
      await this.getListWithFavorites(findParam);
    } else {
      await super.getList(findParam);
    }
  }

  // Helper method to get list with favorite status for authenticated users
  private async getListWithFavorites(findParam: any) {
    const { ctx } = this;
    const userInfo = this.getUserInfo();
    const query = this.getSanitizedQuery();

    try {
      let { pageSize = 10, pageNumber = 1 } = query;
      pageSize = Math.min(Math.max(Number(pageSize) || 10, 1), 100);
      pageNumber = Math.max(Number(pageNumber) || 1, 1);
      const skipNumber = pageSize * pageNumber - pageSize;

      const pipeline: PipelineStage[] = [
        { $match: findParam },
        {
          $lookup: {
            from: 'favorite',
            let: { navId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$navId', '$$navId'] },
                      { $eq: ['$userId', new Types.ObjectId(userInfo.userId)] },
                    ],
                  },
                },
              },
            ],
            as: 'favoriteInfo',
          },
        },
        {
          $addFields: {
            isFavorite: { $gt: [{ $size: '$favoriteInfo' }, 0] },
          },
        },
        {
          $project: {
            favoriteInfo: 0, // Remove the favoriteInfo field from output
          },
        },
        { $sort: { _id: -1 } },
        { $skip: skipNumber },
        { $limit: pageSize },
      ];

      const countPipeline = [{ $match: findParam }, { $count: 'total' }];
      // Handle case where findParam uses $and with nested objects not directly matchable in count
      // Use the same match condition

      const [data, countResult] = await Promise.all([
        ctx.model.Nav.aggregate(pipeline),
        ctx.model.Nav.aggregate(countPipeline),
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;
      const mapped = data.map((d: any) => ctx.model.Nav.hydrate(d));

      this.success({
        data: mapped,
        total,
        pageNumber: Math.ceil(total / pageSize),
      });
    } catch (e: any) {
      this.error(e.message);
    }
  }

  async add() {
    this.ctx.request.body.status = NAV_STATUS.wait;
    this.ctx.request.body.createTime = nowToChromeTime();
    await super.add();
  }

  async reptile() {
    const { ctx } = this;
    const { url } = ctx.query;
    const res = await parseHTML(url);
    if (res === null) {
      this.error('获取网站信息失败');
      return;
    }
    this.success(res);
  }

  async del() {
    await super.remove();
  }

  async edit() {
    this.ctx.request.body.updateTime = new Date();
    const { tags } = this.ctx.request.body;
    if (Array.isArray(tags)) {
      await this.ctx.service.tag.addMultiTag(tags);
    }
    await super.update();
  }

  async audit() {
    this.ctx.request.body.auditTime = new Date();

    const { status, id } = this.ctx.request.body;

    const navItem = await this.ctx.model.Nav.findOne({ _id: id });
    const { tags } = navItem;

    if (status === NAV_STATUS.pass) {
      // 批量添加tag
      await this.ctx.service.tag.addMultiTag(tags);
    }
    await super.update();
  }

  /**
   * 取出一级分类下面的所有网站，并且处理返回
   */
  async info() {
    const { request, model } = this.ctx;
    try {
      const { categoryId } = request.query;
      const resData: any = [];
      // 取所有子分类， apply audience-based filtering
      const isAuthenticated = this.isAuthenticated();
      const categoryFilterBase: any = {
        $or: [{ categoryId }, { _id: categoryId }],
      };

      // Audience filtering for categories (+ legacy hide compatibility)
      const userCtx = this.ctx.state.userinfo as AuthUserContext | undefined;
      const categoryFilter: any = buildAudienceFilterEx(categoryFilterBase, userCtx);

      const categorys = await model.Category.find(categoryFilter);
      const categoryIds = categorys.reduce((t, v) => [...t, v._id], []);

      const navFindParam: any = {
        categoryId: { $in: categoryIds },
      };

      // Filter by status and apply audience visibility for navs
      if (isAuthenticated) {
        // Authenticated users see approved or legacy items without status
        navFindParam.$or = [{ status: { $exists: false } }, { status: NAV_STATUS.pass }];
      } else {
        // Non-authenticated users only see approved items
        navFindParam.status = NAV_STATUS.pass;
      }

      // Audience filtering for navs (+ legacy hide compatibility)
      const finalNavFindParam: any = buildAudienceFilterEx(navFindParam, userCtx);

      const navs = await model.Nav.find(finalNavFindParam);

      // Build favorites set for authenticated users
      let favoriteSet: Set<string> | null = null;
      if (isAuthenticated) {
        const userInfo = this.getUserInfo();
        const favorites = await model.Favorite.find({
          userId: new Types.ObjectId(userInfo.userId),
        }).select('navId');
        favoriteSet = new Set(favorites.map((f: any) => f.navId.toString()));
      }

      categorys.map((category) => {
        const nowNavs = navs
          .filter((nav) => nav.categoryId === category._id.toString())
          .map((nav) => {
            const obj: any = nav.toObject();
            if (favoriteSet) {
              obj.isFavorite = favoriteSet.has(nav._id.toString());
            }
            return obj;
          });
        resData.push({
          _id: category._id,
          id: category._id.toString(),
          name: category.name,
          list: nowNavs,
        });
        return category;
      });
      this.success(resData);
    } catch (error: any) {
      this.error(error.message);
    }
  }

  async get() {
    const { ctx } = this;
    const { id, keyword } = ctx.query;

    if (id) {
      const isAuthenticated = this.isAuthenticated();
      const navQuery: any = { _id: id };

      // Non-authenticated users can only access approved items
      if (!isAuthenticated) {
        navQuery.status = NAV_STATUS.pass;
      }

      // Audience filtering for single item (+ legacy hide compatibility)
      const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
      const nav = await ctx.model.Nav.findOne(buildAudienceFilterEx(navQuery, userCtx));
      if (nav && nav.categoryId) {
        const category = await ctx.model.Category.findOne({ _id: nav.categoryId });
        if (category) {
          const navObj: any = nav.toObject();
          navObj.categoryName = category.name;
          if (isAuthenticated) {
            const userInfo = this.getUserInfo();
            const fav = await ctx.model.Favorite.findOne({
              userId: new Types.ObjectId(userInfo.userId),
              navId: nav._id,
            });
            navObj.isFavorite = !!fav;
          }
          this.success(navObj);
        } else {
          const navObj: any = nav.toObject();
          if (isAuthenticated) {
            const userInfo = this.getUserInfo();
            const fav = await ctx.model.Favorite.findOne({
              userId: new Types.ObjectId(userInfo.userId),
              navId: nav._id,
            });
            navObj.isFavorite = !!fav;
          }
          this.success(navObj);
        }
      } else {
        this.success(nav);
      }
    } else if (keyword) {
      const reg = new RegExp(keyword, 'i');
      let { pageSize = 10, pageNumber = 1 } = ctx.query;
      pageSize = Number(pageSize);
      pageNumber = Number(pageNumber);
      const skipNumber = pageSize * pageNumber - pageSize;

      const searchQuery: any = {
        name: { $regex: reg },
      };

      // For non-authenticated users, filter by status
      const isAuthenticated = this.isAuthenticated();
      if (!isAuthenticated) {
        searchQuery.status = NAV_STATUS.pass; // Only show approved items
      }

      if (isAuthenticated) {
        // Use aggregation pipeline to include favorite status for authenticated users
        await this.getSearchWithFavorites(searchQuery, skipNumber, pageSize);
      } else {
        // Use simple query for non-authenticated users
        const [navs, total] = await Promise.all([
          ctx.model.Nav.find(searchQuery).skip(skipNumber).limit(pageSize).sort({ _id: -1 }),
          ctx.model.Nav.find(searchQuery).countDocuments(),
        ]);

        const navsWithCategory = await Promise.all(
          navs.map(async (nav) => {
            if (nav.categoryId) {
              const category = await ctx.model.Category.findOne({ _id: nav.categoryId });
              const navObj = nav.toObject();
              if (category) {
                navObj.categoryName = category.name;
              }
              return navObj;
            }
            return nav.toObject();
          })
        );

        this.success({
          data: navsWithCategory,
          total,
          pageNumber: Math.ceil(total / pageSize),
        });
      }
    }
  }

  // Helper method for search with favorite status
  private async getSearchWithFavorites(searchQuery: any, skipNumber: number, pageSize: number) {
    const { ctx } = this;
    const userInfo = this.getUserInfo();

    try {
      const pipeline: PipelineStage[] = [
        { $match: searchQuery },
        {
          $lookup: {
            from: 'favorite',
            let: { navId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$navId', '$$navId'] },
                      { $eq: ['$userId', new Types.ObjectId(userInfo.userId)] },
                    ],
                  },
                },
              },
            ],
            as: 'favoriteInfo',
          },
        },
        {
          $lookup: {
            from: 'category',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $addFields: {
            isFavorite: { $gt: [{ $size: '$favoriteInfo' }, 0] },
            categoryName: { $arrayElemAt: ['$category.name', 0] },
          },
        },
        {
          $project: {
            favoriteInfo: 0,
            category: 0,
          },
        },
        { $sort: { _id: -1 } },
        { $skip: skipNumber },
        { $limit: pageSize },
      ];

      const countPipeline = [{ $match: searchQuery }, { $count: 'total' }];

      const [data, countResult] = await Promise.all([
        ctx.model.Nav.aggregate(pipeline),
        ctx.model.Nav.aggregate(countPipeline),
      ]);

      const total = countResult.length > 0 ? countResult[0].total : 0;

      this.success({
        data,
        total,
        pageNumber: Math.ceil(total / pageSize),
      });
    } catch (error: any) {
      this.error(error.message);
    }
  }

  async random() {
    await super.getRandomList();
  }

  async ranking() {
    const isAuthenticated = this.isAuthenticated();

    const [view, star, news] = await Promise.all([
      this.service.nav.findMaxValueList('view', isAuthenticated),
      this.service.nav.findMaxValueList('star', isAuthenticated),
      this.service.nav.findMaxValueList('createTime', isAuthenticated),
    ]);

    this.success({
      view,
      star,
      news,
    });
  }

  // Increment view count atomically
  async incrementView() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      const updated = await ctx.model.Nav.findByIdAndUpdate(
        id,
        { $inc: { view: 1 } },
        { new: true }
      );
      if (!updated) {
        this.error('Nav item not found');
        return;
      }
      this.success({ id: updated._id?.toString?.() ?? updated.id, view: updated.view });
    } catch (e: any) {
      this.error(e.message || 'Failed to increment view');
    }
  }

  // Increment star count atomically
  async incrementStar() {
    const { ctx } = this;
    const { id } = ctx.params;
    if (!id) {
      this.error('id is required');
      return;
    }
    try {
      const updated = await ctx.model.Nav.findByIdAndUpdate(
        id,
        { $inc: { star: 1 } },
        { new: true }
      );
      if (!updated) {
        this.error('Nav item not found');
        return;
      }
      this.success({ id: updated._id?.toString?.() ?? updated.id, star: updated.star });
    } catch (e: any) {
      this.error(e.message || 'Failed to increment star');
    }
  }
}
