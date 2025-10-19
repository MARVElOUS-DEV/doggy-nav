import Controller from '../core/base_controller';

export default class GroupController extends Controller {
  tableName(): string { return 'Group'; }

  async getOne() {
    const { ctx } = this;
    const { id } = ctx.params;
    const group = await ctx.model.Group.findById(id).lean().select('-__v');
    if (!group) {
      this.ctx.status = 404;
      return this.error('Group not found');
    }
    this.success({ data: group });
  }

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

  async add() {
    const body = this.getSanitizedBody();
    const group = await this.ctx.model.Group.create(body);
    this.success({ data: group });
  }

  async edit() {
    await super.update();
  }

  async update() {
    const { ctx } = this;
    const { id } = ctx.params;
    const updateData = ctx.request.body;
    
    const group = await ctx.model.Group.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true, useFindAndModify:true }
    ).lean().select('-__v');
    
    if (!group) {
      this.ctx.status = 404;
      return this.error('Group not found');
    }
    this.success({ data: group });
  }

  async del() {
    await super.remove();
  }
}
