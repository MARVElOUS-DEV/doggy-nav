import Controller from '../core/base_controller';
import { TOKENS } from '../core/ioc';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Tag';
  }

  async getList() {
    const query = this.getSanitizedQuery();
    const service = this.ctx.di.resolve(TOKENS.TagService);
    const res = await service.list({ pageSize: query.pageSize, pageNumber: query.pageNumber } as any);
    this.success(res);
  }
}
