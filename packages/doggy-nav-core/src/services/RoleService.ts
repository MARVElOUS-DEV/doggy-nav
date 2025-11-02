import type { AuthContext, Role } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';
import type { RoleRepository } from '../repositories/RoleRepository';

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 50, 1), 200);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

export class RoleService {
  constructor(private readonly repo: RoleRepository) {}

  async list(page: PageQuery, user?: AuthContext): Promise<PageResult<Role>> {
    const { pageSize, pageNumber } = normalizePage(page);
    const roles = Array.isArray(user?.roles) ? user!.roles! : [];
    const isAdmin = roles.includes('sysadmin') || roles.includes('admin');
    const filter = isAdmin ? undefined : (roles.length > 0 ? { slugs: roles } : { slugs: [] });
    return this.repo.list({ page: { pageSize, pageNumber }, filter });
  }
}

export default RoleService;
