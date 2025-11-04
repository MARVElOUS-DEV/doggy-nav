import type { Tag } from 'doggy-nav-core';
import type { TagRepository } from 'doggy-nav-core';

function mapDocToTag(doc: any): Tag {
  return {
    id: doc._id?.toString?.() ?? doc.id,
    name: doc.name,
    parentName: doc.parentName ?? null,
  };
}

export class MongooseTagRepository implements TagRepository {
  constructor(private readonly ctx: any) {}

  private get model() {
    return this.ctx.model.Tag;
  }

  async list(page: { pageSize?: any; pageNumber?: any }) {
    const pageSize = Math.min(Math.max(Number(page.pageSize) || 10, 1), 200);
    const pageNumber = Math.max(Number(page.pageNumber) || 1, 1);
    const skip = pageSize * pageNumber - pageSize;
    const [rows, total] = await Promise.all([
      this.model.find({}).skip(skip).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      this.model.countDocuments({}),
    ]);
    return { data: rows.map(mapDocToTag), total, pageNumber: Math.ceil(total / pageSize) };
  }

  async getById(id: string) {
    const doc = await this.model.findById(id).lean().select('-__v');
    return doc ? mapDocToTag(doc) : null;
  }

  async getByName(name: string) {
    const doc = await this.model.findOne({ name }).lean().select('-__v');
    return doc ? mapDocToTag(doc) : null;
  }

  async create(name: string) {
    const doc = await this.model.create({ name });
    return mapDocToTag(doc.toObject ? doc.toObject() : doc);
  }

  async update(id: string, name: string) {
    const doc = await this.model.findByIdAndUpdate(id, { name }, { new: true }).lean().select('-__v');
    return doc ? mapDocToTag(doc) : null;
  }

  async delete(id: string) {
    const res = await this.model.findByIdAndDelete(id);
    return !!res;
  }
}

export default MongooseTagRepository;
