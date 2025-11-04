import Controller from '../core/base_controller';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';
import type { TagService } from 'doggy-nav-core';

export default class CategoryController extends Controller {
  @Inject(TOKENS.TagService)
  private tagService!: TagService;

  tableName(): string {
    return 'Tag';
  }

  async getList() {
    const query = this.getSanitizedQuery();
    const res = await this.tagService.list({ pageSize: query.pageSize, pageNumber: query.pageNumber } as any);
    this.success(res);
  }
}
