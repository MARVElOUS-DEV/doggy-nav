import Controller from '../core/base_controller';

export default class UserController extends Controller {
  public async register() {
    const { ctx } = this;
    try {
      const res = await ctx.service.user.register();
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async login() {
    const { ctx } = this;
    try {
      const res = await ctx.service.user.login();
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async profile() {
    const { ctx } = this;
    try {
      const userId = ctx.state.userinfo?.userId;
      if (!userId) {
        return this.error('用户未认证');
      }
      const res = await ctx.service.user.getUserProfile(userId);
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

  public async updateClientSecret() {
    const { ctx } = this;
    try {
      const userId = ctx.state.userinfo?.userId;
      if (!userId) {
        return this.error('用户未认证');
      }
      const res = await ctx.service.user.updateClientSecret(userId);
      this.success(res);
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
      if (isValid) {
        const user = await ctx.service.clientSecret.getUserByClientSecret(clientSecret);
        this.success({ valid: true, user });
      } else {
        this.success({ valid: false });
      }
    } catch (e: any) {
      this.error(e.message);
    }
  }
}
