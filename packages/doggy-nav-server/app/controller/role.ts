import Controller from '../core/base_controller';
import type { AuthUserContext } from '../../types/rbac';
import { RoleService } from 'doggy-nav-core';
import MongooseRoleRepository from '../../adapters/roleRepository';

export default class RoleController extends Controller {
  tableName(): string { return 'Role'; }

  async getList() {
    const { ctx } = this;
    const query = this.getSanitizedQuery();
    const user = ctx.state.userinfo as AuthUserContext | undefined;
    const auth = user
      ? {
          roles:
            Array.isArray(user?.effectiveRoles) && user!.effectiveRoles!.length > 0
              ? user!.effectiveRoles!
              : Array.isArray(user?.roles)
                ? user!.roles!
                : [],
          source: (user?.source === 'admin' ? 'admin' : 'main') as 'admin' | 'main',
        }
      : undefined;
    const service = new RoleService(new MongooseRoleRepository(ctx));
    const res = await service.list({ pageSize: query.pageSize as any, pageNumber: query.pageNumber as any } as any, auth);
    this.success(res);
  }

  async edit() {
    await super.update();
  }

  async del() {
    await super.remove();
  }
}
