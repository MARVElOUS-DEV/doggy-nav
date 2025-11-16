import type { AfficheRepository, PageQuery, PageResult, Affiche } from 'doggy-nav-core';

function mapDoc(doc: any): Affiche {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    text: doc.text ?? '',
    linkHref: doc.linkHref ?? null,
    linkText: doc.linkText ?? null,
    linkTarget: doc.linkTarget ?? null,
    active: Boolean(doc.active),
    order: typeof doc.order === 'number' ? doc.order : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export default class MongooseAfficheRepository implements AfficheRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Affiche;
  }

  async list(page: PageQuery, filter?: { active?: boolean }): Promise<PageResult<Affiche>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = (pageNumber - 1) * pageSize;

    const cond: any = {};
    if (typeof filter?.active === 'boolean') cond.active = filter.active;

    const [rows, total] = await Promise.all([
      this.model
        .find(cond)
        .skip(skip)
        .limit(pageSize)
        .sort({ order: 1, _id: -1 })
        .lean()
        .select('-__v'),
      this.model.countDocuments(cond),
    ]);

    return {
      data: rows.map(mapDoc),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<Affiche | null> {
    const doc = await this.model.findById(id).lean().select('-__v');
    return doc ? mapDoc(doc) : null;
  }

  async create(input: {
    text: string;
    linkHref?: string | null;
    linkText?: string | null;
    linkTarget?: string | null;
    active?: boolean;
    order?: number | null;
  }): Promise<Affiche> {
    const payload: any = {
      text: input.text,
      active: typeof input.active === 'boolean' ? input.active : true,
    };
    if (input.linkHref !== undefined) payload.linkHref = input.linkHref;
    if (input.linkText !== undefined) payload.linkText = input.linkText;
    if (input.linkTarget !== undefined) payload.linkTarget = input.linkTarget;
    if (input.order !== undefined && input.order !== null) payload.order = input.order;

    const doc = await this.model.create(payload);
    const raw = doc.toObject ? doc.toObject() : doc;
    return mapDoc(raw);
  }

  async update(
    id: string,
    input: {
      text?: string;
      linkHref?: string | null;
      linkText?: string | null;
      linkTarget?: string | null;
      active?: boolean;
      order?: number | null;
    }
  ): Promise<Affiche | null> {
    const patch: any = {};
    if (input.text !== undefined) patch.text = input.text;
    if (input.linkHref !== undefined) patch.linkHref = input.linkHref;
    if (input.linkText !== undefined) patch.linkText = input.linkText;
    if (input.linkTarget !== undefined) patch.linkTarget = input.linkTarget;
    if (input.active !== undefined) patch.active = !!input.active;
    if (input.order !== undefined) patch.order = input.order;

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean()
      .select('-__v');
    return doc ? mapDoc(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  async listActive(): Promise<Affiche[]> {
    const rows = await this.model
      .find({ active: true })
      .sort({ order: 1, _id: -1 })
      .lean()
      .select('-__v');
    return rows.map(mapDoc);
  }
}
