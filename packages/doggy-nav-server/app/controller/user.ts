import CommonController from '../core/base_controller';
import { AuthenticationError } from '../core/errors';
import { EnforceAdminOnAdminSource } from '../utils/decorators';
import { UserAuthService } from 'doggy-nav-core';
import { TOKENS } from '../core/ioc';
import MongooseAuthRepository from '../../adapters/authRepository';

export default class UserController extends CommonController {
  tableName(): string {
    return 'User';
  }

  public async register() {
    const { ctx } = this;
    const res = await ctx.service.user.register();
    this.success(res);
  }

  @EnforceAdminOnAdminSource()
  public async login() {
    const { ctx } = this;
    const { username, password } = ctx.request.body || {};
    if ((!username || !password) && typeof (ctx.service as any)?.user?.login === 'function') {
      const legacy = await (ctx.service as any).user.login();
      ctx.body = { code: 1, msg: 'ok', data: { token: legacy?.token, user: legacy?.user } };
      return;
    }
    const repo = new MongooseAuthRepository(ctx);
    const service = new UserAuthService(repo);
    const issueTokens = async (payload: any) => {
      const jwtConfig = ctx.app.config.jwt as {
        accessExpiresIn?: string;
        refreshExpiresIn?: string;
        secret: string;
      };
      const accessToken = ctx.app.jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig?.accessExpiresIn || '15m',
      });
      const refreshToken = ctx.app.jwt.sign(
        { sub: payload.userId, typ: 'refresh' },
        jwtConfig.secret,
        { expiresIn: jwtConfig?.refreshExpiresIn || '7d' }
      );
      return { accessToken, refreshToken };
    };
    const res = await service.login(String(username || ''), String(password || ''), issueTokens);
    if (!res) return this.error('账号或密码错误');
    this.success(res);
  }

  public async profile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await ctx.di.resolve(TOKENS.UserService).getProfile(String(userId));
    this.success(res);
  }

  public async updateProfile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const body = this.getSanitizedBody();
    const res = await ctx.di
      .resolve(TOKENS.UserService)
      .updateProfile(String(userId), { email: body.email, avatar: body.avatar });
    this.success(res);
  }

  // ===== Admin user management =====
  public async adminList() {
    const { ctx } = this;
    const query = this.getSanitizedQuery();
    const pageSize = Math.min(Math.max(Number(query.pageSize || query.page_size || 10), 1), 100);
    const current = Math.max(Number(query.pageNumber || query.current || 1), 1);
    // skipNumber no longer needed with core service pagination

    const filter = {
      account: query.account as any,
      email: query.email as any,
      status:
        query.status !== undefined && query.status !== ''
          ? String(query.status) === '1' || String(query.status) === 'true'
          : undefined,
    };
    const res = await ctx.di
      .resolve(TOKENS.UserService)
      .adminList(filter, { pageSize, pageNumber: current });
    this.success(res);
  }

  public async adminGetOne() {
    const { ctx } = this;
    const { id } = ctx.params;
    const res = await ctx.di.resolve(TOKENS.UserService).adminGetOne(String(id));
    this.success(res);
  }

  public async adminCreate() {
    const { ctx } = this;
    const body = this.getSanitizedBody();
    const service = ctx.di.resolve(TOKENS.UserService);
    try {
      const created = await service.adminCreate({
        account: String(body.account || ''),
        email: String(body.email || ''),
        password: String(body.password || ''),
        status: !!body.status,
        nickName: body.nickName,
        phone: body.phone,
        roles: Array.isArray(body.roles) ? body.roles : undefined,
        role: body.role,
        groups: Array.isArray(body.groups) ? body.groups : undefined,
      });
      this.success(created);
    } catch (e: any) {
      this.error(e?.message || '创建失败');
    }
  }

  public async adminUpdate() {
    const { ctx } = this;
    const { id } = ctx.params;
    const body = this.getSanitizedBody();
    const service = ctx.di.resolve(TOKENS.UserService);
    try {
      const ok = await service.adminUpdate(String(id), {
        account: body.account,
        email: body.email,
        password: body.password,
        status: body.status,
        nickName: body.nickName,
        phone: body.phone,
        roles: Array.isArray(body.roles) ? body.roles : undefined,
        role: body.role,
        groups: Array.isArray(body.groups) ? body.groups : undefined,
      });
      this.success(ok);
    } catch (e: any) {
      this.error(e?.message || '更新失败');
    }
  }

  public async adminDelete() {
    const { ctx } = this;
    const ids: string[] = Array.isArray(ctx.request.body?.ids) ? ctx.request.body.ids : [];
    const ok = await ctx.di.resolve(TOKENS.UserService).adminDelete(ids);
    if (!ok) return this.error('删除失败');
    this.success(true);
  }

  // legacy resolution helpers removed in P4 cleanup
}
