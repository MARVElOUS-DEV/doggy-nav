import Controller from '../core/base_controller';
import type { AuthUserContext } from '../../types/rbac';
import { TOKENS } from '../core/ioc';

export default class GroupController extends Controller {
  tableName(): string { return 'Group'; }

  async getOne() {
    const { ctx } = this;
    const { id } = ctx.params;
    const service = ctx.di.resolve(TOKENS.GroupService);
    const group = await service.getOne(id);
    if (!group) {
      this.ctx.status = 404;
      return this.error('Group not found');
    }
    this.success({ data: group });
  }

  async getList() {
    const { ctx } = this;
    const query = this.getSanitizedQuery();
    const { pageSize = 50, pageNumber = 1 } = query as any;
    const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
    const service = ctx.di.resolve(TOKENS.GroupService);
    const res = await service.list({ pageSize: Number(pageSize), pageNumber: Number(pageNumber) }, {
      roles: userCtx?.roles,
      groups: userCtx?.groups,
    });
    this.success(res);
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

  async addMembers() {
    const { ctx } = this;
    const { id } = ctx.params;
    const userIds: string[] = Array.isArray(ctx.request.body?.userIds) ? ctx.request.body.userIds : [];
    if (!id) return this.error('缺少分组ID');
    if (!userIds.length) return this.error('缺少用户ID列表');
    const group = await ctx.model.Group.findById(id).lean();
    if (!group) return this.error('Group not found');
    const result: any = await ctx.model.User.updateMany({ _id: { $in: userIds } }, { $addToSet: { groups: id } });
    this.success({ modified: result.modifiedCount || result.nModified || 0 });
  }
}
