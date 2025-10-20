import Controller from '../core/base_controller';
import { buildAudienceFilterEx } from '../utils/audienceEx';
import type { AuthUserContext } from '../../types/rbac';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Category';
  }

  async list() {
    const { ctx } = this;
    const { showInMenu } = ctx.query;
    try {
      const params: any = {};
      if (showInMenu) {
        params.showInMenu = { $eq: showInMenu !== 'false' };
      }

      // Audience filtering (+ legacy hide compatibility)
      const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
      const filter = buildAudienceFilterEx(params, userCtx);

      const data = await ctx.model.Category.find(filter).limit(100000);

      const newData = ctx.service.category.formatCategoryList(data);
      this.success(newData);
    } catch (error:any) {
      this.error(error.message);
    }
  }

  async add() {
    await super.add();
  }

  async edit() {
    await super.update();
  }

  async del() {
    const { ctx } = this;
    try {
      const { id } = ctx.request.body;
      const data = await Promise.all([
        ctx.model.Category.deleteOne({ _id: id }),
        ctx.model.Category.deleteOne({ categoryId: id }),
      ]);
      this.success(data);
    } catch (error:any) {
      this.error(error.message);
    }
  }
}
