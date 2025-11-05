import type { Application } from 'doggy-nav-core';
import type { ApplicationRepository, ApplicationCreateInput, ApplicationUpdateInput } from 'doggy-nav-core';

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try { return new Date(d).toISOString(); } catch { return undefined; }
}

function mapDoc(doc: any): Application {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    name: doc.name,
    description: doc.description || '',
    clientSecret: doc.clientSecret,
    isActive: !!doc.isActive,
    allowedOrigins: Array.isArray(doc.allowedOrigins) ? doc.allowedOrigins : [],
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

export class MongooseApplicationRepository implements ApplicationRepository {
  constructor(private readonly ctx: any) {}
  private get model() { return this.ctx.model.Application; }

  async create(input: ApplicationCreateInput) {
    const created = await this.model.create({
      name: input.name,
      description: input.description || '',
      clientSecret: input.clientSecret,
      isActive: true,
      allowedOrigins: input.allowedOrigins || [],
    });
    return mapDoc(created);
  }

  async update(id: string, updates: ApplicationUpdateInput) {
    const doc = await this.model.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true });
    return doc ? mapDoc(doc) : null;
  }

  async list(page: { pageSize: number; pageNumber: number }) {
    const skip = page.pageSize * page.pageNumber - page.pageSize;
    const [rows, total] = await Promise.all([
      this.model.find().sort({ createdAt: -1 }).skip(skip).limit(page.pageSize).lean(),
      this.model.countDocuments(),
    ]);
    return { applications: rows.map(mapDoc), total };
  }

  async getById(id: string) {
    const doc = await this.model.findById(id).lean();
    return doc ? mapDoc(doc) : null;
  }

  async getByClientSecret(secret: string) {
    const doc = await this.model.findOne({ clientSecret: secret, isActive: true }).lean();
    return doc ? mapDoc(doc) : null;
  }

  async setClientSecret(id: string, secret: string) {
    await this.model.findByIdAndUpdate(id, { clientSecret: secret, updatedAt: new Date() });
  }

  async revoke(id: string) {
    await this.model.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() });
    return true;
  }
}

export default MongooseApplicationRepository;
