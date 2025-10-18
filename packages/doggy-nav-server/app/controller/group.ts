import Controller from '../core/base_controller';

export default class GroupController extends Controller {
  tableName(): string { return 'Group'; }

  async getList() {
    const { ctx } = this;
    const query = this.getSanitizedQuery();
    let { pageSize = 50, pageNumber = 1 } = query as any;
    pageSize = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
    pageNumber = Math.max(Number(pageNumber) || 1, 1);
    const skipNumber = pageSize * pageNumber - pageSize;
    const [ data, total ] = await Promise.all([
      ctx.model.Group.find({}).skip(skipNumber).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      ctx.model.Group.countDocuments(),
    ]);
    this.success({ data, total, pageNumber: Math.ceil(total / pageSize) });
  }

  async edit() {
    await super.update();
  }

  async del() {
    await super.remove();
  }
}
