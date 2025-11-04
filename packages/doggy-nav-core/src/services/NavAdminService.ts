import type { NavAdminRepository, NavAdminCreateInput, NavAdminUpdateInput } from '../repositories/NavAdminRepository';

export class NavAdminService {
  constructor(private readonly repo: NavAdminRepository) {}

  async create(input: NavAdminCreateInput): Promise<{ id: string }> {
    if (!input.name || !input.href) {
      const err = new Error('name and href are required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.create(input);
  }

  async update(id: string, input: NavAdminUpdateInput): Promise<{ id: string } | null> {
    if (!id) {
      const err = new Error('id required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.update(id, input);
  }

  async delete(id: string): Promise<boolean> {
    if (!id) return false;
    return this.repo.delete(id);
  }

  async audit(id: string, status: number, reason?: string): Promise<boolean> {
    if (!id) {
      const err = new Error('id required');
      (err as any).name = 'ValidationError';
      throw err;
    }
    return this.repo.setAudit(id, status, reason);
  }
}

export default NavAdminService;
