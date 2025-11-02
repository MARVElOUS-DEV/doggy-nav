import type { AuthContext, Group } from '../domain/types';
import type { PageQuery, PageResult } from '../dto/pagination';
import type { GroupRepository } from '../repositories/GroupRepository';

export class GroupService {
  constructor(private readonly repo: GroupRepository) {}

  async getOne(id: string): Promise<Group | null> {
    return this.repo.getById(id);
  }

  async list(
    page: PageQuery,
    user?: AuthContext
  ): Promise<PageResult<Group>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 50, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);

    const roles = Array.isArray(user?.roles) ? user!.roles! : [];
    const isAdmin = roles.includes('sysadmin') || roles.includes('admin');
    const userGroups = Array.isArray(user?.groups) ? user!.groups! : [];

    const filter = isAdmin
      ? undefined
      : (userGroups.length > 0 ? { slugs: userGroups } : { slugs: [] });

    return this.repo.list({ pageSize, pageNumber, filter });
  }
}
