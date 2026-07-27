import type {
  AiProvider,
  AiProviderConfig,
  AiProviderCreateInput,
  AiProviderRepository,
  AiProviderUpdateInput,
  PageQuery,
  PageResult,
} from 'doggy-nav-core';

function toISO(d: any): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(d).toISOString();
  } catch {
    return undefined;
  }
}

function mapDoc(doc: any): AiProvider {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    name: doc.name,
    provider: doc.provider || 'openai-compatible',
    baseURL: doc.baseURL,
    model: doc.model,
    active: Boolean(doc.active),
    apiKeySet: Boolean(doc.apiKey),
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

function mapDocToConfig(doc: any): AiProviderConfig {
  return {
    ...mapDoc(doc),
    apiKey: String(doc.apiKey || ''),
  };
}

export default class MongooseAiProviderRepository implements AiProviderRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.AiProvider;
  }

  async list(page: PageQuery): Promise<PageResult<AiProvider>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = (pageNumber - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.model.find({}).skip(skip).limit(pageSize).sort({ active: -1, _id: -1 }).lean(),
      this.model.countDocuments(),
    ]);

    return {
      data: rows.map(mapDoc),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<AiProvider | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? mapDoc(doc) : null;
  }

  async create(input: AiProviderCreateInput): Promise<AiProvider> {
    if (input.active) {
      await this.model.updateMany({ active: true }, { $set: { active: false } });
    }
    const doc = await this.model.create({
      name: input.name,
      provider: input.provider,
      baseURL: input.baseURL,
      model: input.model,
      apiKey: input.apiKey,
      active: Boolean(input.active),
    });
    const raw = doc.toObject ? doc.toObject() : doc;
    return mapDoc(raw);
  }

  async update(id: string, input: AiProviderUpdateInput): Promise<AiProvider | null> {
    const current = await this.model.findById(id).lean();
    if (!current) return null;
    if (input.active === true) {
      await this.model.updateMany({ _id: { $ne: id }, active: true }, { $set: { active: false } });
    }
    const patch: any = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.provider !== undefined) patch.provider = input.provider;
    if (input.baseURL !== undefined) patch.baseURL = input.baseURL;
    if (input.model !== undefined) patch.model = input.model;
    if (input.apiKey !== undefined) patch.apiKey = input.apiKey;
    if (input.active !== undefined) patch.active = Boolean(input.active);

    const doc = await this.model.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    return doc ? mapDoc(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return Boolean(res);
  }

  async setActive(id: string): Promise<AiProvider | null> {
    const current = await this.model.findById(id).lean();
    if (!current) return null;
    await this.model.updateMany({ _id: { $ne: id }, active: true }, { $set: { active: false } });
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: { active: true } }, { new: true })
      .lean();
    return doc ? mapDoc(doc) : null;
  }

  async getConfigById(id: string): Promise<AiProviderConfig | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? mapDocToConfig(doc) : null;
  }

  async getActiveConfig(): Promise<AiProviderConfig | null> {
    const doc = await this.model.findOne({ active: true }).sort({ updatedAt: -1 }).lean();
    return doc ? mapDocToConfig(doc) : null;
  }
}
