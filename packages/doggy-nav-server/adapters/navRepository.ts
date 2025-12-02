import type { NavItem } from 'doggy-nav-core';
import type { NavRepository, NavListOptions } from 'doggy-nav-core';
import { Types } from 'mongoose';

function mapDocToNav(doc: any): NavItem {
  const source = doc?.toJSON ? doc.toJSON() : doc;
  return {
    id: source._id?.toString?.() ?? source.id,
    categoryId: source.categoryId ?? null,
    name: source.name,
    href: source.href ?? null,
    desc: source.desc ?? null,
    detail: source.detail ?? null,
    logo: source.logo ?? null,
    authorName: source.authorName ?? null,
    authorUrl: source.authorUrl ?? null,
    auditTime: source.auditTime ? new Date(source.auditTime).toISOString() : null,
    createTime: typeof source.createTime === 'number' ? source.createTime : null,
    createTimeDate: source.createTimeDate ?? null,
    lastUrlCheckDate: source.lastUrlCheckDate ?? null,
    tags: Array.isArray(source.tags) ? source.tags : [],
    view: typeof source.view === 'number' ? source.view : undefined,
    star: typeof source.star === 'number' ? source.star : undefined,
    status: typeof source.status === 'number' ? source.status : undefined,
    isFavorite: typeof source.isFavorite === 'boolean' ? source.isFavorite : undefined,
    audience: source.audience
      ? {
          visibility: source.audience.visibility,
          allowRoles: (source.audience.allowRoles || []).map((x: any) =>
            x?.toString ? x.toString() : x
          ),
          allowGroups: (source.audience.allowGroups || []).map((x: any) =>
            x?.toString ? x.toString() : x
          ),
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
    
    // Date range filtering using Chrome time
    if (filter?.createTimeStart !== undefined || filter?.createTimeEnd !== undefined) {
      cond.createTime = {};
      if (filter.createTimeStart !== undefined) {
        cond.createTime.$gte = filter.createTimeStart;
      }
      if (filter.createTimeEnd !== undefined) {
        cond.createTime.$lt = filter.createTimeEnd;
      }
    }

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
      const hydrated = rows.map((row) => this.model.hydrate(row));
      return { data: hydrated.map(mapDocToNav), total, pageNumber: Math.ceil(total / pageSize) };
    }

    const [rows, total] = await Promise.all([
      this.model.find(cond).skip(skip).limit(pageSize).sort({ _id: -1 }).select('-__v'),
      this.model.countDocuments(cond),
    ]);
    return { data: rows.map(mapDocToNav), total, pageNumber: Math.ceil(total / pageSize) };
  }
}

export default MongooseNavRepository;
