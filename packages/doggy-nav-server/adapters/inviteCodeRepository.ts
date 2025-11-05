import type { InviteCode } from 'doggy-nav-core';
import type {
  InviteCodeRepository,
  InviteCodeListOptions,
  InviteCodeCreateItem,
  InviteCodeUpdatePatch,
} from 'doggy-nav-core';

function toISO(d: any): string | null {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch { return null; }
}

function mapDoc(doc: any): InviteCode {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    code: doc.code,
    usageLimit: doc.usageLimit,
    usedCount: doc.usedCount ?? 0,
    active: !!doc.active,
    expiresAt: toISO(doc.expiresAt),
    allowedEmailDomain: doc.allowedEmailDomain ?? null,
    createdBy: doc.createdBy ? (doc.createdBy.toString?.() ?? String(doc.createdBy)) : null,
    lastUsedAt: toISO(doc.lastUsedAt),
    lastUsedBy: doc.lastUsedBy ? (doc.lastUsedBy.toString?.() ?? String(doc.lastUsedBy)) : null,
    note: doc.note ?? '',
    createdAt: toISO(doc.createdAt),
    updatedAt: toISO(doc.updatedAt),
  };
}

export class MongooseInviteCodeRepository implements InviteCodeRepository {
  constructor(private readonly ctx: any) {}
  private get model() { return this.ctx.model.InviteCode; }

  async list(options: InviteCodeListOptions) {
    const { page, filter } = options;
    const skip = page.pageSize * page.pageNumber - page.pageSize;
    const cond: any = {};
    if (typeof filter?.active === 'boolean') cond.active = filter.active;
    if (filter?.codeSearch) cond.code = { $regex: new RegExp(filter.codeSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } as any;
    const [rows, total] = await Promise.all([
      this.model.find(cond).sort({ createdAt: -1 }).skip(skip).limit(page.pageSize).lean().select('-__v'),
      this.model.countDocuments(cond),
    ]);
    return { data: rows.map(mapDoc), total, pageNumber: Math.ceil(total / page.pageSize) };
  }

  async createBulk(items: InviteCodeCreateItem[]) {
    const docs = items.map((i) => ({
      code: i.code,
      usageLimit: i.usageLimit,
      expiresAt: i.expiresAt ? new Date(i.expiresAt) : null,
      note: i.note ?? '',
      allowedEmailDomain: i.allowedEmailDomain ?? null,
      createdBy: i.createdBy || undefined,
    }));
    const created = await this.model.insertMany(docs);
    return created.map(mapDoc);
  }

  async getById(id: string) {
    const doc = await this.model.findById(id).lean().select('-__v');
    return doc ? mapDoc(doc) : null;
  }

  async update(id: string, patch: InviteCodeUpdatePatch) {
    const update: any = {};
    if (typeof patch.active === 'boolean') update.active = patch.active;
    if (typeof patch.usageLimit === 'number') update.usageLimit = patch.usageLimit;
    if (patch.expiresAt !== undefined) update.expiresAt = patch.expiresAt ? new Date(patch.expiresAt) : null;
    if (patch.note !== undefined) update.note = patch.note ?? '';
    if (patch.allowedEmailDomain !== undefined) update.allowedEmailDomain = patch.allowedEmailDomain ?? null;
    const doc = await this.model.findByIdAndUpdate(id, update, { new: true });
    return doc ? mapDoc(doc) : null;
  }
}

export default MongooseInviteCodeRepository;
