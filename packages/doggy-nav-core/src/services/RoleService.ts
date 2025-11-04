import type { AuthContext, Role } from '../types/types';
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
    const filter = isAdmin ? undefined : roles.length > 0 ? { slugs: roles } : { slugs: [] };
    return this.repo.list({ page: { pageSize, pageNumber }, filter });
  }

  async getById(id: string): Promise<Role | null> {
    return this.repo.getById(id);
  }

  async getBySlug(slug: string): Promise<Role | null> {
    return this.repo.getBySlug(slug);
  }

  async create(input: {
    slug: string;
    displayName: string;
    description?: string;
    permissions?: string[];
    isSystem?: boolean;
  }): Promise<Role> {
    if (!input.slug || !input.displayName) {
      const err = new Error('Slug and display name are required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    const existing = await this.repo.getBySlug(input.slug);
    if (existing) {
      const err = new Error('Role with this slug already exists');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.create({
      slug: input.slug,
      displayName: input.displayName,
      description: input.description || '',
      permissions: Array.isArray(input.permissions) ? input.permissions : [],
      isSystem: !!input.isSystem,
    });
  }

  async update(
    id: string,
    updates: Partial<{
      slug: string;
      displayName: string;
      description: string;
      permissions: string[];
      isSystem: boolean;
    }>
  ): Promise<Role | null> {
    const existing = await this.repo.getById(id);
    if (!existing) return null;
    if (existing.isSystem && updates.isSystem === false) {
      const err = new Error('Cannot modify system role properties');
      (err as any).name = 'ValidationError';
      throw err;
    }
    if (updates.slug && updates.slug !== existing.slug) {
      const dup = await this.repo.getBySlug(updates.slug);
      if (dup && dup.id !== id) {
        const err = new Error('Role with this slug already exists');
        (err as any).name = 'ValidationError';
        throw err;
      }
    }
    if (updates.permissions && !Array.isArray(updates.permissions)) {
      updates.permissions = [];
    }
    return this.repo.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.repo.getById(id);
    if (!existing) return false;
    if (existing.isSystem) {
      const err = new Error('Cannot delete system role');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.delete(id);
  }

  async getPermissions(id: string): Promise<string[]> {
    return this.repo.getRolePermissions(id);
  }

  async setPermissions(id: string, permissions: string[]): Promise<void> {
    await this.repo.setRolePermissions(id, Array.isArray(permissions) ? permissions : []);
  }
}

export default RoleService;
