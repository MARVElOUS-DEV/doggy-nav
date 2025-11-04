import type { AuthContext, Group } from '../types/types';
import type { PageQuery, PageResult } from '../dto/pagination';
import type { GroupRepository } from '../repositories/GroupRepository';

export class GroupService {
  constructor(private readonly repo: GroupRepository) {}

  async getOne(id: string): Promise<Group | null> {
    return this.repo.getById(id);
  }

  async list(page: PageQuery, user?: AuthContext): Promise<PageResult<Group>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 50, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);

    const roles = Array.isArray(user?.roles) ? user!.roles! : [];
    const isAdmin = roles.includes('sysadmin') || roles.includes('admin');
    const userGroups = Array.isArray(user?.groups) ? user!.groups! : [];

    const filter = isAdmin
      ? undefined
      : userGroups.length > 0
        ? { slugs: userGroups }
        : { slugs: [] };

    return this.repo.list({ pageSize, pageNumber, filter });
  }

  async create(input: { slug: string; displayName: string; description?: string }): Promise<Group> {
    if (!input.slug || !input.displayName) {
      const err = new Error('slug and displayName are required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    const dup = await this.repo.getBySlug(input.slug);
    if (dup) {
      const err = new Error('Group already exists');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.create(input);
  }

  async update(id: string, patch: Partial<{ slug: string; displayName: string; description: string }>): Promise<Group | null> {
    if (patch.slug) {
      const dup = await this.repo.getBySlug(patch.slug);
      if (dup && dup.id !== id) {
        const err = new Error('Group already exists');
        (err as any).name = 'ValidationError';
        throw err;
      }
    }
    return this.repo.update(id, patch);
  }

  async delete(id: string): Promise<boolean> {
    return this.repo.delete(id);
  }

  async setUsers(groupId: string, userIds: string[]): Promise<void> {
    await this.repo.setGroupUsers(groupId, Array.isArray(userIds) ? userIds : []);
  }
}
