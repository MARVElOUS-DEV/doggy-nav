import type { Category } from 'doggy-nav-core';
import type { CategoryRepository, CategoryListOptions } from 'doggy-nav-core';

function mapDocToCategory(doc: any): Category {
  const source = doc?.toJSON ? doc.toJSON() : doc;
  const childrenSource = source.childrenWithDates ?? source.children;
  return {
    id: source._id?.toString?.() ?? source.id,
    name: source.name,
    categoryId: source.categoryId ?? null,
    description: source.description ?? null,
    onlyFolder: !!source.onlyFolder,
    icon: source.icon ?? null,
    showInMenu: typeof source.showInMenu === 'boolean' ? source.showInMenu : undefined,
    createAtDate: source.createAtDate ?? null,
    children: Array.isArray(childrenSource)
      ? childrenSource.map((child: any) => ({
          ...child,
          createAtDate: child.createAtDate ?? null,
        }))
      : undefined,
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

export class MongooseCategoryRepository implements CategoryRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Category;
  }

  async listAll(options?: CategoryListOptions): Promise<Category[]> {
    const cond: any = {};
    if (typeof options?.showInMenu === 'boolean') cond.showInMenu = options.showInMenu;
    const rows = await this.model.find(cond).limit(100000).select('-__v');
    return rows.map(mapDocToCategory);
  }
}

export default MongooseCategoryRepository;
