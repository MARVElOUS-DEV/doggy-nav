import Controller from '../core/base_controller';
import { AuthenticationError } from '../core/errors';

export default class UserController extends Controller {
  tableName(): string {
    return 'User';
  }

  public async register() {
    const { ctx } = this;
    const res = await ctx.service.user.register();
    this.success(res);
  }

  public async login() {
    const { ctx } = this;
    const res = await ctx.service.user.login();
    this.success(res);
  }

  public async profile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await ctx.service.user.getUserProfile(userId);
    this.success(res);
  }

  public async updateProfile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await ctx.service.user.updateProfile(userId);
    this.success(res);
  }
}
