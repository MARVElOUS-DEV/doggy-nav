import type { FavoriteRepository } from 'doggy-nav-core';
import type { NavItem, FavoriteUnionItem } from 'doggy-nav-core';
import { Types } from 'mongoose';

function mapRowToNav(row: any): NavItem {
  const n = row.navItem || row;
  return {
    id: n._id?.toString?.() ?? n.id,
    name: n.name,
    href: n.href ?? null,
    desc: n.desc ?? null,
    logo: n.logo ?? null,
    authorName: n.authorName ?? null,
    authorUrl: n.authorUrl ?? null,
    categoryId: n.categoryId ?? null,
    categoryName: n.categoryName ?? null,
    tags: Array.isArray(n.tags) ? n.tags : [],
    view: typeof n.view === 'number' ? n.view : undefined,
    star: typeof n.star === 'number' ? n.star : undefined,
    status: typeof n.status === 'number' ? n.status : undefined,
    isFavorite: true,
    createTime: typeof n.createTime === 'number' ? n.createTime : null,
    auditTime: n.auditTime ? new Date(n.auditTime).toISOString() : null,
    audience: n.audience
      ? {
          visibility: n.audience.visibility,
          allowRoles: (n.audience.allowRoles || []).map((x: any) => (x?.toString ? x.toString() : x)),
          allowGroups: (n.audience.allowGroups || []).map((x: any) => (x?.toString ? x.toString() : x)),
        }
      : undefined,
  } as NavItem;
}

export class MongooseFavoriteRepository implements FavoriteRepository {
  constructor(private readonly ctx: any) {}

  private get fav() {
    return this.ctx.model.Favorite;
  }
  private get nav() {
    return this.ctx.model.Nav;
  }
  private get cat() {
    return this.ctx.model.Category;
  }

  async list(userId: string, page: { pageSize?: any; pageNumber?: any }) {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = pageSize * pageNumber - pageSize;

    const excludeHiddenStage: any = { $match: { 'navItem.audience.visibility': { $ne: 'hide' } } };
    const pipeline: any[] = [
      { $match: { userId: new Types.ObjectId(userId) } },
      { $lookup: { from: 'nav', localField: 'navId', foreignField: '_id', as: 'navItem' } },
      { $unwind: '$navItem' },
      excludeHiddenStage,
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
          pipeline: [{ $project: { name: 1 } }],
        },
      },
      { $addFields: { 'navItem.categoryName': { $ifNull: [{ $arrayElemAt: ['$category.name', 0] }, null] } } },
      {
        $project: {
          _id: 0,
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
            createTime: '$navItem.createTime',
            auditTime: '$navItem.auditTime',
            audience: '$navItem.audience',
          },
        },
      },
      { $sort: { 'navItem._id': -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const countPipeline: any[] = [
      { $match: { userId: new Types.ObjectId(userId) } },
      { $count: 'total' },
    ];

    const [rows, countRes] = await Promise.all([
      this.fav.aggregate(pipeline),
      this.fav.aggregate(countPipeline),
    ]);
    const total = countRes.length > 0 ? countRes[0].total : 0;
    return {
      data: rows.map(mapRowToNav),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async check(userId: string, navId: string) {
    const found = await this.fav.findOne({ userId, navId }).lean();
    return !!found;
  }

  async count(userId: string) {
    return await this.fav.countDocuments({ userId });
  }

  async structured(userId: string): Promise<FavoriteUnionItem[]> {
    const folders = await this.ctx.model.FavoriteFolder
      .find({ userId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const rootFavorites = await this.fav.aggregate([
      { $match: { userId: new Types.ObjectId(userId), parentFolderId: null } },
      { $lookup: { from: 'nav', localField: 'navId', foreignField: '_id', as: 'navItem' } },
      { $unwind: '$navItem' },
      { $match: { 'navItem.audience.visibility': { $ne: 'hide' } } },
      { $addFields: { categoryObjectId: { $cond: [ { $regexMatch: { input: '$navItem.categoryId', regex: /^[a-fA-F0-9]{24}$/ } }, { $toObjectId: '$navItem.categoryId' }, null ] } } },
      { $lookup: { from: 'category', localField: 'categoryObjectId', foreignField: '_id', as: 'category', pipeline: [ { $project: { name: 1 } } ] } },
      { $addFields: { 'navItem.categoryName': { $ifNull: [ { $arrayElemAt: [ '$category.name', 0 ] }, null ] } } },
      { $project: { _id: 1, order: 1, navItem: 1 } },
      { $sort: { order: 1, createdAt: -1 } },
    ]);

    const folderIds = folders.map((f: any) => f._id);
    const folderItems: Record<string, NavItem[]> = {};
    if (folderIds.length) {
      const items = await this.fav.aggregate([
        { $match: { userId: new Types.ObjectId(userId), parentFolderId: { $in: folderIds.map((id: any) => new Types.ObjectId(id)) } } },
        { $lookup: { from: 'nav', localField: 'navId', foreignField: '_id', as: 'navItem' } },
        { $unwind: '$navItem' },
        { $match: { 'navItem.audience.visibility': { $ne: 'hide' } } },
        { $addFields: { categoryObjectId: { $cond: [ { $regexMatch: { input: '$navItem.categoryId', regex: /^[a-fA-F0-9]{24}$/ } }, { $toObjectId: '$navItem.categoryId' }, null ] } } },
        { $lookup: { from: 'category', localField: 'categoryObjectId', foreignField: '_id', as: 'category', pipeline: [ { $project: { name: 1 } } ] } },
        { $addFields: { 'navItem.categoryName': { $ifNull: [ { $arrayElemAt: [ '$category.name', 0 ] }, null ] } } },
        { $project: { _id: 1, parentFolderId: 1, order: 1, navItem: 1 } },
        { $sort: { order: 1, createdAt: -1 } },
      ]);
      for (const it of items) {
        const key = String(it.parentFolderId);
        if (!folderItems[key]) folderItems[key] = [];
        folderItems[key].push({ ...mapRowToNav(it), isFavorite: true });
      }
    }

    const union: FavoriteUnionItem[] = [];
    for (const f of folders) {
      union.push({
        type: 'folder',
        order: f.order ?? 0,
        folder: {
          id: String(f._id),
          name: f.name,
          order: f.order ?? null,
          coverNavId: f.coverNavId ? String(f.coverNavId) : null,
        },
        items: folderItems[String(f._id)] || [],
      });
    }
    for (const r of rootFavorites) {
      union.push({ type: 'nav', order: r.order ?? 0, nav: { ...mapRowToNav(r), isFavorite: true } });
    }
    union.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    return union;
  }
}

export default MongooseFavoriteRepository;
