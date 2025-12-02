import { PipelineStage, Types } from 'mongoose';
import { parseHTML } from '../../utils/reptileHelper';
import { nowToChromeTime } from 'doggy-nav-core';
import Controller from '../core/base_controller';
import type { AuthUserContext } from '../../types/rbac';
import { buildAudienceFilterEx } from '../utils/audience';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';
import type { NavService } from 'doggy-nav-core';

enum NAV_STATUS {
  pass,
  wait,
  refuse,
}

export default class NavController extends Controller {
  @Inject(TOKENS.NavService)
  private navService!: NavService;

  tableName(): string {
    return 'Nav';
  }

  async list() {
    const { ctx } = this;
    const { status = 0, categoryId, name, year } = ctx.query;
    const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
    const query = this.getSanitizedQuery();
    const page = { pageSize: query.pageSize, pageNumber: query.pageNumber } as any;
    const auth = userCtx
      ? {
          roles:
            Array.isArray(userCtx?.effectiveRoles) && userCtx!.effectiveRoles!.length > 0
              ? userCtx!.effectiveRoles!
              : Array.isArray(userCtx?.roles)
                ? userCtx!.roles!
                : [],
          groups: Array.isArray(userCtx?.groups) ? userCtx!.groups! : [],
          roleIds: Array.isArray((userCtx as any)?.roleIds) ? (userCtx as any).roleIds : [],
          groupIds: Array.isArray((userCtx as any)?.groupIds) ? (userCtx as any).groupIds : [],
          source: (userCtx?.source === 'admin' ? 'admin' : 'main') as 'admin' | 'main',
        }
      : undefined;
    const res = await this.navService.list(
      page,
      {
        status: status !== undefined && status !== '' ? Number(status) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
        name: name ? String(name) : undefined,
        year: year ? Number(year) : undefined,
      },
      auth
    );
    this.success(res);
  }

  // Helper method to get list with favorite status for authenticated users (legacy; retained for other endpoints)
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

    try {
      await super.add();

      // Send notifications after successful submission
      const { name: navItemName, submitterEmail, submitterName } = this.ctx.request.body;
      if (navItemName && submitterEmail) {
        await this.sendSubmissionNotifications(navItemName, submitterEmail, submitterName);
      }
    } catch (error: any) {
      this.ctx.logger.error('Failed to add nav item:', error);
      throw error;
    }
  }

  // Helper method to send submission notifications
  private async sendSubmissionNotifications(
    navItemName: string,
    submitterEmail: string,
    submitterName?: string
  ) {
    try {
      const emailService = this.ctx.service.email;

      // Send notification to submitter
      await emailService.sendSubmissionNotification(submitterEmail, navItemName);

      // Send notification to admins
      const settings = await emailService.getSettings();
      if (settings?.adminEmails && settings.adminEmails.length > 0) {
        await emailService.sendAdminNotification(settings.adminEmails, navItemName, submitterName);
      }

      this.ctx.logger.info(`Submission notifications sent for ${navItemName}`);
    } catch (error: any) {
      // Log email errors but don't fail the submission process
      this.ctx.logger.error('Failed to send submission notifications:', error);
    }
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

    const { status, id, reason } = this.ctx.request.body;

    try {
      const navItem = await this.ctx.model.Nav.findOne({ _id: id });
      if (!navItem) {
        this.error('Nav item not found');
        return;
      }

      const { tags } = navItem;

      // Send notifications based on audit result
      await this.sendAuditNotifications(navItem, status, reason);

      if (status === NAV_STATUS.pass) {
        // 批量添加tag
        await this.ctx.service.tag.addMultiTag(tags);
      }

      await super.update();
    } catch (error: any) {
      this.ctx.logger.error('Audit failed:', error);
      this.error(error.message || 'Audit failed');
    }
  }

  // Helper method to send audit notifications
  private async sendAuditNotifications(navItem: any, status: number, reason?: string) {
    try {
      const { name: navItemName, submitterEmail } = navItem;

      // Don't send notifications if submitter email is not available
      if (!submitterEmail) {
        this.ctx.logger.warn(
          `No submitter email for nav item ${navItem._id}, skipping notifications`
        );
        return;
      }

      const emailService = this.ctx.service.email;

      // Send notification to submitter based on audit result
      if (status === NAV_STATUS.pass) {
        await emailService.sendApprovalNotification(submitterEmail, navItemName);
      } else if (status === NAV_STATUS.refuse) {
        await emailService.sendRejectionNotification(submitterEmail, navItemName, reason);
      }

      this.ctx.logger.info(`Audit notifications sent for nav item ${navItem._id}`);
    } catch (error: any) {
      // Log email errors but don't fail the audit process
      this.ctx.logger.error('Failed to send audit notifications:', error);
    }
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
          navObj.detail = nav.detail ?? navObj.detail ?? null;
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
          navObj.detail = nav.detail ?? navObj.detail ?? null;
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

      // Align status filtering with list() and enforce audience rules
      const isAuthenticated = this.isAuthenticated();
      if (isAuthenticated) {
        searchQuery.$or = [{ status: { $exists: false } }, { status: NAV_STATUS.pass }];
      } else {
        searchQuery.status = NAV_STATUS.pass;
      }

      const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
      let findParam: any = buildAudienceFilterEx(searchQuery, userCtx);

      // Also enforce category visibility: nav must be in allowed categories OR have no category
      try {
        const allowedCategoryFilter = buildAudienceFilterEx({}, userCtx);
        const allowedCategories =
          await ctx.model.Category.find(allowedCategoryFilter).select('_id');
        const allowedCategoryIds = allowedCategories.map((c: any) => c._id.toString());
        const categoryVisibilityOr = [{ categoryId: { $in: allowedCategoryIds } }];
        findParam = { $and: [findParam, { $or: categoryVisibilityOr }] };
      } catch {
        // Fallback to nav-only filtering if category check fails
      }

      if (isAuthenticated) {
        await this.getSearchWithFavorites(findParam, skipNumber, pageSize);
      } else {
        const [navs, total] = await Promise.all([
          ctx.model.Nav.find(findParam).skip(skipNumber).limit(pageSize).sort({ _id: -1 }),
          ctx.model.Nav.find(findParam).countDocuments(),
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
  private async getSearchWithFavorites(findParam: any, skipNumber: number, pageSize: number) {
    const { ctx } = this;
    const userInfo = this.getUserInfo();

    try {
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

      const countPipeline = [{ $match: findParam }, { $count: 'total' }];

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
