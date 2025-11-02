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
}

export default MongooseTagRepository;
