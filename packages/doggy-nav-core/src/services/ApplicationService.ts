import type { Application } from '../domain/application';
import type { PageQuery } from '../dto/pagination';
import type { ApplicationRepository, ApplicationUpdateInput } from '../repositories/ApplicationRepository';

function normalizePage(page: PageQuery) {
  const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 100);
  const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
  return { pageSize, pageNumber };
}

export class ApplicationService {
  constructor(private readonly repo: ApplicationRepository) {}

  generateClientSecret(): string {
    const hex = 'abcdef0123456789';
    let out = '';
    for (let i = 0; i < 64; i++) out += hex[Math.floor(Math.random() * hex.length)];
    return out;
  }

  async create(name: string, description?: string, allowedOrigins?: string[]): Promise<Application> {
    const clientSecret = this.generateClientSecret();
    return this.repo.create({ name, description, clientSecret, allowedOrigins });
  }

  async list(page: PageQuery): Promise<{ applications: Application[]; total: number }> {
    const p = normalizePage(page);
    return this.repo.list(p);
  }

  async update(id: string, updates: ApplicationUpdateInput): Promise<Application | null> {
    if (updates.allowedOrigins && !Array.isArray(updates.allowedOrigins)) {
      updates.allowedOrigins = [];
    }
    return this.repo.update(id, updates);
  }

  async regenerateClientSecret(id: string): Promise<string> {
    const secret = this.generateClientSecret();
    await this.repo.setClientSecret(id, secret);
    return secret;
  }

  async revoke(id: string): Promise<boolean> {
    return this.repo.revoke(id);
  }

  async verifyClientSecret(secret: string): Promise<boolean> {
    const app = await this.repo.getByClientSecret(secret);
    return !!(app && app.isActive);
  }
}

export default ApplicationService;
