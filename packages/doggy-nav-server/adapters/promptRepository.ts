import type { PromptRepository } from 'doggy-nav-core';
import type { PageQuery, PageResult } from 'doggy-nav-core';
import type { Prompt } from 'doggy-nav-core';

function mapDocToPrompt(doc: any): Prompt {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    name: doc.name,
    content: doc.content ?? '',
    active: Boolean(doc.active),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
  };
}

export default class MongoosePromptRepository implements PromptRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Prompt;
  }

  async list(page: PageQuery): Promise<PageResult<Prompt>> {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = (pageNumber - 1) * pageSize;

    const [rows, total] = await Promise.all([
      this.model.find({}).skip(skip).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      this.model.countDocuments(),
    ]);

    return {
      data: rows.map(mapDocToPrompt),
      total,
      pageNumber: Math.ceil(total / pageSize),
    };
  }

  async getById(id: string): Promise<Prompt | null> {
    const doc = await this.model.findById(id).lean().select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }

  async create(input: { name: string; content: string; active?: boolean }): Promise<Prompt> {
    if (input.active) {
      await this.model.updateMany({ active: true }, { $set: { active: false } });
    }
    const doc = await this.model.create({
      name: input.name,
      content: input.content,
      active: !!input.active,
    });
    const raw = doc.toObject ? doc.toObject() : doc;
    return mapDocToPrompt(raw);
  }

  async update(
    id: string,
    input: { name?: string; content?: string; active?: boolean }
  ): Promise<Prompt | null> {
    if (input.active) {
      await this.model.updateMany({ active: true }, { $set: { active: false } });
    }
    const patch: any = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.content !== undefined) patch.content = input.content;
    if (input.active !== undefined) patch.active = !!input.active;

    const doc = await this.model
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .lean()
      .select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }

  async getActive(): Promise<Prompt | null> {
    const doc = await this.model.findOne({ active: true }).lean().select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }

  async setActive(id: string): Promise<Prompt | null> {
    await this.model.updateMany({ active: true }, { $set: { active: false } });
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: { active: true } }, { new: true })
      .lean()
      .select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }
}
