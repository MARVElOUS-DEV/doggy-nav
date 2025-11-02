import Controller from '../core/base_controller';
import { TOKENS } from '../core/ioc';

export default class ApplicationController extends Controller {
  tableName(): string {
    return 'Application';
  }
  // Common authentication check
  private requireAuth() {
    if (!this.isAuthenticated()) {
      this.error('用户未认证');
      return false;
    }
    return true;
  }

  // Check if application exists (admin access required for all operations)
  private async checkApplicationAccess(applicationId: string) {
    const userInfo = this.getUserInfo();

    if (!userInfo.roles?.includes?.('sysadmin')) {
      this.error('权限不足，需要管理员权限');
      return { hasAccess: false, application: null };
    }

    const application = await this.ctx.model.Application.findById(applicationId);
    if (!application) {
      this.error('应用不存在');
      return { hasAccess: false, application: null };
    }

    return { hasAccess: true, application };
  }

  public async create() {
    const { ctx } = this;
    try {
      if (!this.requireAuth()) return;

      const userInfo = this.getUserInfo();
      if (!userInfo.roles?.includes?.('sysadmin')) {
        return this.error('权限不足，需要管理员权限');
      }

      const { name, description, allowedOrigins } = ctx.request.body;

      if (!name) {
        return this.error('应用名称不能为空');
      }

      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const application = await service.create(name, description, allowedOrigins);
      this.success(application);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async list() {
    const { ctx } = this;
    try {
      if (!this.requireAuth()) return;

      const userInfo = this.getUserInfo();
      if (!userInfo.roles?.includes?.('sysadmin')) {
        return this.error('权限不足，需要管理员权限');
      }

      const { page = 1, limit = 10 } = ctx.query as any;
      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const res = await service.list({ pageNumber: Number(page), pageSize: Number(limit) });
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async update() {
    const { ctx } = this;
    try {
      if (!this.requireAuth()) return;

      const { id } = ctx.params;
      const updates = ctx.request.body;

      const { hasAccess } = await this.checkApplicationAccess(id);
      if (!hasAccess) return;

      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const updated = await service.update(id, updates);
      this.success(updated);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async regenerateSecret() {
    const { ctx } = this;
    try {
      if (!this.requireAuth()) return;

      const { id } = ctx.params;

      const { hasAccess } = await this.checkApplicationAccess(id);
      if (!hasAccess) return;

      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const newSecret = await service.regenerateClientSecret(id);
      this.success({ clientSecret: newSecret });
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async revoke() {
    const { ctx } = this;
    try {
      if (!this.requireAuth()) return;

      const { id } = ctx.params;

      const { hasAccess } = await this.checkApplicationAccess(id);
      if (!hasAccess) return;

      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const ok = await service.revoke(id);
      if (ok) this.success({ message: '应用已撤销' }); else this.error('撤销失败');
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async verifyClientSecret() {
    const { ctx } = this;
    try {
      const { clientSecret } = ctx.request.body;
      if (!clientSecret) {
        return this.error('Client secret is required');
      }
      const service = ctx.di.resolve(TOKENS.ApplicationService);
      const isValid = await service.verifyClientSecret(clientSecret);
      this.success({ valid: isValid });
    } catch (e: any) {
      this.error(e.message);
    }
  }
}
