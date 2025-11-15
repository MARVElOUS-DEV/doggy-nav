import CommonController from '../core/base_controller';
import { AuthenticationError } from '../core/errors';
import { EnforceAdminOnAdminSource } from '../utils/decorators';
import { UserAuthService } from 'doggy-nav-core';
import { TOKENS } from '../core/ioc';
import { Inject } from '../core/inject';
import type { UserService } from 'doggy-nav-core';
import MongooseAuthRepository from '../../adapters/authRepository';

export default class UserController extends CommonController {
  @Inject(TOKENS.UserService)
  private userService!: UserService;

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
    // Legacy fallback: if body is empty but old service.login exists, delegate and normalize shape
    if ((!username || !password) && typeof (ctx.service as any)?.user?.login === 'function') {
      const legacy = await (ctx.service as any).user.login();
      if (!legacy) {
        throw new AuthenticationError('账号或密码错误');
      }
      return {
        token: legacy.token,
        tokens: legacy.tokens ?? {
          accessToken:
            typeof legacy.token === 'string' && legacy.token.startsWith('Bearer ')
              ? legacy.token.slice(7)
              : legacy.token,
          refreshToken: undefined,
        },
        user: legacy.user,
      };
    }

    if (!username || !password) {
      throw new AuthenticationError('请输入用户名和密码');
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
    if (!res) {
      throw new AuthenticationError('账号或密码错误');
    }
    return res;
  }

  public async profile() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const res = await this.userService.getProfile(String(userId));
    this.success(res);
  }

  public async updateProfile() {
    const userId = this.ctx.state.userinfo?.userId;
    if (!userId) {
      throw new AuthenticationError('用户未认证');
    }
    const body = this.getSanitizedBody();
    const res = await this.userService.updateProfile(String(userId), {
      email: body.email,
      avatar: body.avatar,
    });
    this.success(res);
  }

  // ===== Admin user management =====
  public async adminList() {
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
    const res = await this.userService.adminList(filter, { pageSize, pageNumber: current });
    this.success(res);
  }

  public async adminGetOne() {
    const { id } = this.ctx.params;
    const res = await this.userService.adminGetOne(String(id));
    this.success(res);
  }

  public async adminCreate() {
    const body = this.getSanitizedBody();
    try {
      const created = await this.userService.adminCreate({
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
    const { id } = this.ctx.params;
    const body = this.getSanitizedBody();
    try {
      const ok = await this.userService.adminUpdate(String(id), {
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
    const ids: string[] = Array.isArray(this.ctx.request.body?.ids)
      ? this.ctx.request.body.ids
      : [];
    const ok = await this.userService.adminDelete(ids);
    if (!ok) return this.error('删除失败');
    this.success(true);
  }

  // legacy resolution helpers removed in P4 cleanup
}
