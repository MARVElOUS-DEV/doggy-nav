import CommonController from '../core/base_controller';
import { AuthenticationError } from '../core/errors';
import { setAuthCookies } from '../utils/authCookie';

export default class UserController extends CommonController {
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
    setAuthCookies(ctx, res.tokens);
    this.success({
      token: res.token,
      user: res.user,
    });
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
