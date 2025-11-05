import type { RoleRepository } from 'doggy-nav-core';
import type { Role } from 'doggy-nav-core';

function mapDocToRole(doc: any): Role {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    slug: doc.slug,
    displayName: doc.displayName,
    description: doc.description ?? '',
    permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
    isSystem: !!doc.isSystem,
  };
}

export class MongooseRoleRepository implements RoleRepository {
  constructor(private readonly ctx: any) {}
  private get model() { return this.ctx.model.Role; }

  async list(options: { page: { pageSize: number; pageNumber: number }, filter?: { slugs?: string[] } }) {
    const { page, filter } = options;
    const skip = page.pageSize * page.pageNumber - page.pageSize;
    const cond: any = filter?.slugs ? { slug: { $in: filter.slugs } } : {};
    const [rows, total] = await Promise.all([
      this.model.find(cond).skip(skip).limit(page.pageSize).sort({ _id: -1 }).lean().select('-__v'),
      this.model.countDocuments(cond),
    ]);
    return { data: rows.map(mapDocToRole), total, pageNumber: Math.ceil(total / page.pageSize) };
  }

  async getById(id: string): Promise<Role | null> {
    const doc = await this.model.findById(id).lean().select('-__v');
    return doc ? mapDocToRole(doc) : null;
  }

  async getBySlug(slug: string): Promise<Role | null> {
    const doc = await this.model.findOne({ slug }).lean().select('-__v');
    return doc ? mapDocToRole(doc) : null;
  }

  async create(input: { slug: string; displayName: string; description?: string; permissions?: string[]; isSystem?: boolean }): Promise<Role> {
    const doc = await this.model.create({
      slug: input.slug,
      displayName: input.displayName,
      description: input.description ?? '',
      permissions: Array.isArray(input.permissions) ? input.permissions : [],
      isSystem: !!input.isSystem,
    });
    return mapDocToRole(doc.toObject ? doc.toObject() : doc);
  }

  async update(id: string, patch: Partial<{ slug: string; displayName: string; description: string; permissions: string[]; isSystem: boolean }>): Promise<Role | null> {
    const doc = await this.model
      .findByIdAndUpdate(
        id,
        {
          ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.permissions !== undefined ? { permissions: patch.permissions } : {}),
          ...(patch.isSystem !== undefined ? { isSystem: patch.isSystem } : {}),
        },
        { new: true }
      )
      .lean()
      .select('-__v');
    return doc ? mapDocToRole(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  async getRolePermissions(id: string): Promise<string[]> {
    const doc = await this.model.findById(id).lean().select('permissions');
    return Array.isArray(doc?.permissions) ? doc!.permissions : [];
  }

  async setRolePermissions(id: string, permissions: string[]): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { permissions: Array.isArray(permissions) ? permissions : [] } }).exec();
  }
}

export default MongooseRoleRepository;
