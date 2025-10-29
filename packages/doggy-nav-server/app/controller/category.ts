import Controller from '../core/base_controller';
import { buildAudienceFilterEx } from '../utils/audience';
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

      // Compute visible nav counts per category for current user (exclude visibility='hide' via buildAudienceFilterEx)
      const isAuthenticated = this.isAuthenticated();
      let navBase: any = {};
      if (!isAuthenticated) {
        navBase.status = 0; // NAV_STATUS.pass
      } else {
        navBase = { $or: [{ status: { $exists: false } }, { status: 0 }] };
      }
      const navMatch = buildAudienceFilterEx(navBase, userCtx);
      const counts = await ctx.model.Nav.aggregate([
        { $match: navMatch },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]);
      const navCountMap = new Map<string, number>(counts.map((c: any) => [String(c._id), c.count]));

      const newData = ctx.service.category.formatCategoryList(data);

      // Attach hasNav flag (and navCount) recursively
      const attachFlags = (node: any): any => {
        const id = String(node.id || node._id || '');
        const count = navCountMap.get(id) || 0;
        const children = Array.isArray(node.children) ? node.children.map(attachFlags) : node.children;
        return { ...node, hasNav: count > 0, navCount: count, children };
      };
      const enriched = Array.isArray(newData) ? newData.map(attachFlags) : newData;
      this.success(enriched);
    } catch (error: any) {
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
    } catch (error: any) {
      this.error(error.message);
    }
  }
}
