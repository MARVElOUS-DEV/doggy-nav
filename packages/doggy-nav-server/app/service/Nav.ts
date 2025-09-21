import { Service } from 'egg';

export enum NAV_STATUS {
  pass,
  wait,
  reject
}


export default class NavService extends Service {
  async findMaxValueList(value) {
    return await this.ctx.model.Nav.find({ status: NAV_STATUS.pass }).sort({ [value]: -1 }).limit(10);
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

    return stats[0] || {
      total: 0,
      accessibleUrls: 0,
      inaccessibleUrls: 0,
      unknownUrls: 0,
      checkingUrls: 0,
      avgResponseTime: null,
      lastChecked: null,
    };
  }
}
