import Controller from '../core/base_controller';
import { TagService } from 'doggy-nav-core';
import MongooseTagRepository from '../../adapters/tagRepository';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Tag';
  }

  async getList() {
    const query = this.getSanitizedQuery();
    const repo = new MongooseTagRepository(this.ctx);
    const service = new TagService(repo);
    const res = await service.list({ pageSize: query.pageSize, pageNumber: query.pageNumber } as any);
    this.success(res);
  }
}
