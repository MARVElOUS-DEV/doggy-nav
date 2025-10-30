import { buildAudienceFilterEx } from '../utils/audience';
import { Service } from 'egg';
import { SortOrder } from 'mongoose';

export enum NAV_STATUS {
  pass,
  wait,
  reject,
}

export default class NavService extends Service {
  async findMaxValueList(value: string, _isAuthenticated = false) {
    const { ctx } = this;
    const userCtx = ctx.state.userinfo as { roleIds?: string[]; groupIds?: string[] };
    const baseQuery: any = { status: NAV_STATUS.pass };

    // Audience filtering (nav-level)
    let finalQuery: any = buildAudienceFilterEx(baseQuery, userCtx as any);

    // Enforce category audience rules: only include navs whose category is visible to this user
    try {
      const allowedCategoryFilter = buildAudienceFilterEx({}, userCtx as any);
      const allowedCategories = await ctx.model.Category.find(allowedCategoryFilter).select('_id');
      const allowedCategoryIds = allowedCategories.map((c: any) => c._id.toString());
      finalQuery = { $and: [finalQuery, { categoryId: { $in: allowedCategoryIds } }] };
    } catch {
      // fall back to nav-only visibility if category check fails
    }

    const docs = await ctx.model.Nav.find(finalQuery)
      .sort({ [value]: -1 } as { [key: string]: SortOrder })
      .limit(10);
    return docs.map((doc) => doc.toJSON());
  }

  /**
   * Get nav items with URL status information
   * @param query - MongoDB query object
   * @param options - Query options (sort, limit, skip, etc.)
   */
  async findWithUrlStatus(query = {}, options = {}) {
    const { ctx } = this;

    const defaultOptions = {
      sort: { createTime: -1 },
      limit: 20,
      skip: 0,
    };

    const queryOptions = { ...defaultOptions, ...options };

    return ctx.model.Nav.find(query, null, queryOptions);
  }

  /**
   * Get nav statistics including URL status distribution
   */
  async getNavStatistics() {
    const { ctx } = this;

    const stats = await ctx.model.Nav.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          accessibleUrls: {
            $sum: { $cond: [{ $eq: ['$urlStatus', 'accessible'] }, 1, 0] },
          },
          inaccessibleUrls: {
            $sum: { $cond: [{ $eq: ['$urlStatus', 'inaccessible'] }, 1, 0] },
          },
          unknownUrls: {
            $sum: { $cond: [{ $eq: ['$urlStatus', 'unknown'] }, 1, 0] },
          },
          checkingUrls: {
            $sum: { $cond: [{ $eq: ['$urlStatus', 'checking'] }, 1, 0] },
          },
          avgResponseTime: {
            $avg: {
              $cond: [
                { $and: [{ $ne: ['$responseTime', null] }, { $gt: ['$responseTime', 0] }] },
                '$responseTime',
                null,
              ],
            },
          },
          lastChecked: { $max: '$lastUrlCheck' },
        },
      },
    ]);

    return (
      stats[0] || {
        total: 0,
        accessibleUrls: 0,
        inaccessibleUrls: 0,
        unknownUrls: 0,
        checkingUrls: 0,
        avgResponseTime: null,
        lastChecked: null,
      }
    );
  }
}
