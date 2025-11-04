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

  async getBySlug(slug: string) {
    const doc = await this.model.findOne({ slug }).lean().select('-__v');
    return doc ? mapDocToGroup(doc) : null;
  }

  async create(input: { slug: string; displayName: string; description?: string }) {
    const doc = await this.model.create({
      slug: input.slug,
      displayName: input.displayName,
      description: input.description ?? '',
    });
    return mapDocToGroup(doc.toObject ? doc.toObject() : doc);
  }

  async update(
    id: string,
    patch: Partial<{ slug: string; displayName: string; description: string }>
  ) {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        {
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
        },
        { new: true }
      )
      .lean()
      .select('-__v');
    return doc ? mapDocToGroup(doc) : null;
  }

  async delete(id: string) {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  async setGroupUsers(groupId: string, userIds: string[]) {
    const User = this.ctx.model.User;
    await User.updateMany({ groups: groupId }, { $pull: { groups: groupId } }).exec();
    if (Array.isArray(userIds) && userIds.length) {
      await User.updateMany({ _id: { $in: userIds } }, { $addToSet: { groups: groupId } }).exec();
    }
  }
}

export default MongooseGroupRepository;
