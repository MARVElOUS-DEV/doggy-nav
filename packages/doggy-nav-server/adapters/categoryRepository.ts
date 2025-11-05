import type { Category } from 'doggy-nav-core';
import type { CategoryRepository, CategoryListOptions } from 'doggy-nav-core';

function mapDocToCategory(doc: any): Category {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    name: doc.name,
    categoryId: doc.categoryId ?? null,
    description: doc.description ?? null,
    onlyFolder: !!doc.onlyFolder,
    icon: doc.icon ?? null,
    showInMenu: typeof doc.showInMenu === 'boolean' ? doc.showInMenu : undefined,
    audience: doc.audience
      ? {
          visibility: doc.audience.visibility,
          allowRoles: (doc.audience.allowRoles || []).map((x: any) => (x?.toString ? x.toString() : x)),
          allowGroups: (doc.audience.allowGroups || []).map((x: any) => (x?.toString ? x.toString() : x)),
        }
      : undefined,
  };
}

export class MongooseCategoryRepository implements CategoryRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Category;
  }

  async listAll(options?: CategoryListOptions): Promise<Category[]> {
    const cond: any = {};
    if (typeof options?.showInMenu === 'boolean') cond.showInMenu = options.showInMenu;
    const rows = await this.model.find(cond).limit(100000).lean().select('-__v');
    return rows.map(mapDocToCategory);
  }
}

export default MongooseCategoryRepository;
