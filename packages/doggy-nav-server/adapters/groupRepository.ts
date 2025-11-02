import type { Group } from 'doggy-nav-core';
import type { GroupRepository, GroupListOptions } from 'doggy-nav-core';

function mapDocToGroup(doc: any): Group {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    slug: doc.slug,
    displayName: doc.displayName,
    description: doc.description ?? '',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export class MongooseGroupRepository implements GroupRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Group;
  }

  async getById(id: string) {
    const doc = await this.model.findById(id).lean().select('-__v');
    if (!doc) return null;
    return mapDocToGroup(doc);
  }

  async list(options: GroupListOptions) {
    const { pageSize, pageNumber, filter } = options;
    const skip = pageSize * pageNumber - pageSize;
    const cond: any = filter?.slugs ? { slug: { $in: filter.slugs } } : {};

    const [rows, total] = await Promise.all([
      this.model.find(cond).skip(skip).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      this.model.countDocuments(cond),
    ]);

    return {
      data: rows.map(mapDocToGroup),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }
}

export default MongooseGroupRepository;
