import type { PromptRepository } from 'doggy-nav-core';
import type { PageQuery, PageResult } from 'doggy-nav-core';
import type { Prompt } from 'doggy-nav-core';
import { DEFAULT_PROMPT_CODE } from 'doggy-nav-core';

function mapDocToPrompt(doc: any): Prompt {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    code: doc.code || DEFAULT_PROMPT_CODE,
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

  async create(input: {
    code?: string;
    name: string;
    content: string;
    active?: boolean;
  }): Promise<Prompt> {
    const code = input.code || DEFAULT_PROMPT_CODE;
    if (input.active) {
      await this.model.updateMany({ code, active: true }, { $set: { active: false } });
    }
    const doc = await this.model.create({
      code,
      name: input.name,
      content: input.content,
      active: !!input.active,
    });
    const raw = doc.toObject ? doc.toObject() : doc;
    return mapDocToPrompt(raw);
  }

  async update(
    id: string,
    input: { code?: string; name?: string; content?: string; active?: boolean }
  ): Promise<Prompt | null> {
    const current = await this.model.findById(id).lean().select('-__v');
    if (!current) return null;
    const currentCode = current.code || DEFAULT_PROMPT_CODE;
    const code = input.code || currentCode;
    const shouldBeActive = input.active === undefined ? Boolean(current.active) : Boolean(input.active);
    if (shouldBeActive && (input.active || code !== currentCode)) {
      await this.model.updateMany({ code, active: true }, { $set: { active: false } });
    }
    const patch: any = {};
    if (input.code !== undefined) patch.code = input.code || DEFAULT_PROMPT_CODE;
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

  async getActiveByCode(code: string): Promise<Prompt | null> {
    const doc = await this.model
      .findOne({ code: code || DEFAULT_PROMPT_CODE, active: true })
      .lean()
      .select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }

  async setActive(id: string): Promise<Prompt | null> {
    const current = await this.model.findById(id).lean().select('-__v');
    if (!current) return null;
    const code = current.code || DEFAULT_PROMPT_CODE;
    await this.model.updateMany({ code, active: true }, { $set: { active: false } });
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: { code, active: true } }, { new: true })
      .lean()
      .select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }

  async setActiveForCode(code: string, id: string): Promise<Prompt | null> {
    const normalizedCode = code || DEFAULT_PROMPT_CODE;
    await this.model.updateMany({ code: normalizedCode, active: true }, { $set: { active: false } });
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: { code: normalizedCode, active: true } }, { new: true })
      .lean()
      .select('-__v');
    return doc ? mapDocToPrompt(doc) : null;
  }
}
