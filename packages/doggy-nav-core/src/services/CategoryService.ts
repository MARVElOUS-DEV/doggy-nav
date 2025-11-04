import type { AuthContext, Category, Audience, Visibility } from '../types/types';
import type { CategoryRepository, CategoryListOptions } from '../repositories/CategoryRepository';

function isIdLike(v?: string | null): v is string {
  return !!v && typeof v === 'string' && v.length > 0;
}

function isSysAdmin(roles?: string[]) {
  const r = Array.isArray(roles) ? roles : [];
  return r.includes('sysadmin');
}

function hasAny(hay: string[] | undefined, needles: string[] | undefined) {
  if (!Array.isArray(hay) || !Array.isArray(needles)) return false;
  const set = new Set(hay);
  return needles.some((n) => set.has(n));
}

function audienceVisible(aud: Audience | undefined, user?: AuthContext): boolean {
  const vis: Visibility = (aud?.visibility as Visibility) || 'public';
  const roles = Array.isArray(user?.roles) ? user!.roles! : [];
  const roleIds = Array.isArray(user?.roleIds) ? user!.roleIds! : [];
  const groupIds = Array.isArray(user?.groupIds) ? user!.groupIds! : [];
  if (isSysAdmin(roles)) return true;
  if (vis === 'hide') return false;
  if (vis === 'public') return true;
  if (vis === 'authenticated') return !!user;
  if (vis === 'restricted') {
    const allowRoles = (aud?.allowRoles || []).map(String);
    const allowGroups = (aud?.allowGroups || []).map(String);
    return hasAny(allowRoles, roleIds) || hasAny(allowGroups, groupIds);
  }
  return true;
}

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  async listTree(user: AuthContext | undefined, opts: CategoryListOptions & { rootId: string }) {
    const { showInMenu, rootId } = opts;
    const rows = await this.repo.listAll({ showInMenu });
    const visible = rows.filter((c) => audienceVisible(c.audience, user));

    // Build map by parent id
    const byParent = new Map<string, Category[]>();
    for (const c of visible) {
      const pid = isIdLike(c.categoryId) ? String(c.categoryId) : '';
      if (!byParent.has(pid)) byParent.set(pid, []);
      byParent.get(pid)!.push({ ...c, children: undefined });
    }

    // Recursively attach children
    const attach = (node: Category): Category => {
      const kids = byParent.get(String(node.id)) || [];
      return { ...node, children: kids.map(attach) };
    };

    const roots = byParent.get(rootId) || [];
    return roots.map(attach);
  }
}

export default CategoryService;
