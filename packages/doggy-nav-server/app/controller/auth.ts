import { randomBytes } from 'crypto';
import CommonController from '../core/base_controller';
import { clearAuthCookies, setAuthCookies, setStateCookie, getStateCookie, clearStateCookie } from '../utils/authCookie';
import type { AuthUserContext } from '../../types/rbac';
import { getEnabledProviders, isProviderEnabled } from '../utils/oauth';

export default class AuthController extends CommonController {
  private async issueCookiesForUser(user: { _id: any; username: string; roles?: Array<{ _id?: any; slug?: string } | string>; groups?: Array<{ _id?: any; slug?: string } | string>; computedPermissions?: string[]; extraPermissions?: string[]; }) {
    const { ctx } = this;
    // Ensure JWT payload uses role/group slugs by loading populated user first
    const authUser = await ctx.service.user.getAuthUserForTokens(user._id);
    const tokens = await ctx.service.user.generateTokens(authUser);
    await ctx.service.user.recordSuccessfulLogin(tokens.payload.userId);
    setAuthCookies(ctx, tokens);
  }

  async oauthInit() {
    const { app, ctx } = this;
    const prov = ctx.params.provider;
    if (!prov || !isProviderEnabled(app, prov)) {
      ctx.status = 404;
      ctx.body = { code: 404, msg: 'Provider not found', data: null };
      return;
    }

    const strategyConfig = (app.config as any).oauth?.[prov];

    if (!strategyConfig?.clientID || !strategyConfig?.clientSecret) {
      ctx.status = 404;
      ctx.body = { code: 404, msg: 'Provider not configured', data: null };
      return;
    }

    const state = randomBytes(16).toString('hex');
    setStateCookie(ctx, state);

    const passport = (app as any).passport;

    ctx.logger.debug('[oauth/init] redirecting to provider', { provider: prov });
    await (passport.authenticate as any)(prov, {
      session: false,
      scope: strategyConfig.scope,
      state,
    })(ctx);
  }

  async issueTokenAndRedirect() {
    const { ctx, app } = this;
    const queryState = typeof ctx.query.state === 'string' ? ctx.query.state : '';
    const cookieState = getStateCookie(ctx);

    if (!cookieState || cookieState !== queryState) {
      clearAuthCookies(ctx);
      clearStateCookie(ctx);
      ctx.redirect('/login?err=state');
      return;
    }

    const user = ctx.user;
    if (!user) {
      ctx.logger.warn('[oauth/callback] no user on context after passport', { provider: ctx.params.provider });
      clearStateCookie(ctx);
      ctx.redirect('/login?err=oauth_user');
      return;
    }

    await this.issueCookiesForUser(user);
    clearStateCookie(ctx);
    const redirectTo = app.config.oauth?.baseUrl || '/';
    ctx.logger.debug('[oauth/callback] issuing cookies and redirect', { provider: ctx.params.provider, to: redirectTo });
    if (redirectTo.startsWith('/')) {
      ctx.redirect(redirectTo);
    } else {
      ctx.unsafeRedirect(redirectTo);
    }
  }

  async me() {
    const { ctx } = this;
    const info = ctx.state.userinfo;
    if (info?.userId) {
      const user = await ctx.service.user.getById(info.userId);
      this.success({ authenticated: true, user });
      return;
    }
    this.success({ authenticated: false, user: null });
  }

  // Explicit refresh endpoint: exchanges refresh token cookie for new access+refresh
  async refresh() {
    const { ctx, app } = this;
    try {
      const jwt = app.jwt;
      const secret = app.config.jwt?.secret;
      if (!jwt || !secret) return this.error('JWT not available');

      const refresh = ctx.cookies.get('refresh_token');
      if (!refresh) return this.error('缺少refresh token');
      const payload: any = await jwt.verify(refresh, secret);
      if (payload?.typ !== 'refresh' || !payload?.sub) return this.error('refresh token 类型错误');

      const user = await ctx.service.user.getAuthUserForTokens(payload.sub);
      const tokens = await ctx.service.user.generateTokens(user);
      setAuthCookies(ctx, tokens);
      ctx.state.userinfo = { ...tokens.payload, authType: 'jwt' } as AuthUserContext;
      this.success({ token: 'Bearer ' + tokens.accessToken });
    } catch {
      this.error('刷新失败');
    }
  }

  async logout() {
    const { ctx } = this;
    clearAuthCookies(ctx);
    clearStateCookie(ctx);
    ctx.status = 204;
  }

  async providers() {
    const { app } = this;
    const providers = getEnabledProviders(app);
    this.success({ providers });
  }

  async getAuthConfig() {
    const { app } = this;
    const inviteConfig = app.config.invite || {};
    this.success({
      requireInviteForLocalRegister: !!inviteConfig.requireForLocalRegister,
    });
  }
}
