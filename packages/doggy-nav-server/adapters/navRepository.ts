import type { NavItem } from 'doggy-nav-core';
import type { NavRepository, NavListOptions } from 'doggy-nav-core';
import { Types } from 'mongoose';

function mapDocToNav(doc: any): NavItem {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    categoryId: doc.categoryId ?? null,
    name: doc.name,
    href: doc.href ?? null,
    desc: doc.desc ?? null,
    logo: doc.logo ?? null,
    authorName: doc.authorName ?? null,
    authorUrl: doc.authorUrl ?? null,
    auditTime: doc.auditTime ? new Date(doc.auditTime).toISOString() : null,
    createTime: typeof doc.createTime === 'number' ? doc.createTime : null,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    view: typeof doc.view === 'number' ? doc.view : undefined,
    star: typeof doc.star === 'number' ? doc.star : undefined,
    status: typeof doc.status === 'number' ? doc.status : undefined,
    isFavorite: typeof doc.isFavorite === 'boolean' ? doc.isFavorite : undefined,
    audience: doc.audience
      ? {
          visibility: doc.audience.visibility,
          allowRoles: (doc.audience.allowRoles || []).map((x: any) => (x?.toString ? x.toString() : x)),
          allowGroups: (doc.audience.allowGroups || []).map((x: any) => (x?.toString ? x.toString() : x)),
        }
      : undefined,
  };
}

export class MongooseNavRepository implements NavRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Nav;
  }

  async list(options: NavListOptions) {
    const { page, filter, userIdForFavorites } = options;
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = pageSize * pageNumber - pageSize;

    const cond: any = {};
    if (filter?.status !== undefined) cond.status = Number(filter.status);
    if (filter?.categoryId) cond.categoryId = { $eq: filter.categoryId };
    if (filter?.name) cond.name = { $regex: new RegExp(filter.name, 'i') };

    // If userIdForFavorites provided, enrich with isFavorite flag via aggregation
    if (userIdForFavorites) {
      const pipeline: any[] = [
        { $match: cond },
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
                      { $eq: ['$userId', new Types.ObjectId(userIdForFavorites)] },
                    ],
                  },
                },
              },
            ],
            as: 'favoriteInfo',
          },
        },
        { $addFields: { isFavorite: { $gt: [{ $size: '$favoriteInfo' }, 0] } } },
        { $project: { favoriteInfo: 0 } },
        { $sort: { _id: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const countPipeline: any[] = [{ $match: cond }, { $count: 'total' }];
      const [rows, countRes] = await Promise.all([
        this.model.aggregate(pipeline),
        this.model.aggregate(countPipeline),
      ]);
      const total = countRes.length > 0 ? countRes[0].total : 0;
      return { data: rows.map(mapDocToNav), total, pageNumber: Math.ceil(total / pageSize) };
    }

    const [rows, total] = await Promise.all([
      this.model.find(cond).skip(skip).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      this.model.countDocuments(cond),
    ]);
    return { data: rows.map(mapDocToNav), total, pageNumber: Math.ceil(total / pageSize) };
  }
}

export default MongooseNavRepository;
