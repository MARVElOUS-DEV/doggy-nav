import Controller from '../core/base_controller';

export default class UserController extends Controller {
  tableName(): string {
    return 'User';
  }
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

  public async updateProfile() {
    const { ctx } = this;
    try {
      const userId = ctx.state.userinfo?.userId;
      if (!userId) {
        return this.error('用户未认证');
      }
      const res = await ctx.service.user.updateProfile(userId);
      this.success(res);
    } catch (e: any) {
      this.error(e.message);
    }
  }

}
