import Controller from '../core/base_controller';

export default class CategoryController extends Controller {
  tableName(): string {
    return 'Category';
  }

  async list() {
    const { ctx } = this;
    const { showInMenu, hide } = ctx.query;
    try {
      const params: any = {};
      if (showInMenu) {
        params.showInMenu = { $eq: showInMenu !== 'false' };
      }

      // Filter hide based on authentication state
      // If user is not authenticated, exclude hidden items
      // If user is authenticated, include all items unless hide parameter is explicitly set
      const isAuthenticated = this.isAuthenticated();
      if (!isAuthenticated) {
        // For non-authenticated users, only show non-hidden items
        params.hide = { $eq: false };
      } else if (hide !== undefined) {
        // For authenticated users, respect the hide parameter if provided
        params.hide = { $eq: hide === 'true' };
      }

      const data = await ctx.model.Category.find(params).limit(100000);

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
