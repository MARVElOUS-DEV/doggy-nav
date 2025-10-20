import Controller from '../core/base_controller';
import type { AuthUserContext } from '../../types/rbac';

export default class RoleController extends Controller {
  tableName(): string { return 'Role'; }

  async getList() {
    const { ctx } = this;
    // roles are simple docs; lean for speed
    const query = this.getSanitizedQuery();
    let { pageSize = 50, pageNumber = 1 } = query as any;
    pageSize = Math.min(Math.max(Number(pageSize) || 50, 1), 200);
    pageNumber = Math.max(Number(pageNumber) || 1, 1);
    const skipNumber = pageSize * pageNumber - pageSize;
    const userCtx = ctx.state.userinfo as AuthUserContext | undefined;
    const roles = Array.isArray(userCtx?.roles) ? userCtx!.roles : [];
    const isAdmin = roles.includes('sysadmin') || roles.includes('admin');

    const cond = isAdmin ? {} : (roles.length > 0 ? { slug: { $in: roles } } : { _id: { $in: [] } });

    const [ data, total ] = await Promise.all([
      ctx.model.Role.find(cond).skip(skipNumber).limit(pageSize).sort({ _id: -1 }).lean().select('-__v'),
      ctx.model.Role.countDocuments(cond),
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
