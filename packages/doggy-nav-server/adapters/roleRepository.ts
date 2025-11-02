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
}

export default MongooseRoleRepository;
