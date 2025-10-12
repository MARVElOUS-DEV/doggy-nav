import Controller from '../core/base_controller';

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

    if (!userInfo.isAdmin) {
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
      if (!userInfo.isAdmin) {
        return this.error('权限不足，需要管理员权限');
      }

      const { name, description, allowedOrigins } = ctx.request.body;

      if (!name) {
        return this.error('应用名称不能为空');
      }

      const application = await ctx.service.clientSecret.createApplication(
        name,
        description,
        allowedOrigins,
      );
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
      if (!userInfo.isAdmin) {
        return this.error('权限不足，需要管理员权限');
      }

      const { page = 1, limit = 10 } = ctx.query;
      const result = await ctx.service.clientSecret.getAllApplications(Number(page), Number(limit));

      this.success(result);
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

      const updatedApplication = await ctx.service.clientSecret.updateApplication(id, updates);
      this.success(updatedApplication);
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

      const newSecret = await ctx.service.clientSecret.regenerateClientSecret(id);
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

      const success = await ctx.service.clientSecret.revokeApplication(id);
      if (success) {
        this.success({ message: '应用已撤销' });
      } else {
        this.error('撤销失败');
      }
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

      const isValid = await ctx.service.clientSecret.verifyClientSecret(clientSecret);
      this.success({ valid: isValid });
    } catch (e: any) {
      this.error(e.message);
    }
  }
}
