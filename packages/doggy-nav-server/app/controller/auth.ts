import { randomBytes } from 'crypto';
import CommonController from '../core/base_controller';
import {
  clearAuthCookies,
  setAuthCookies,
  setStateCookie,
  getStateCookie,
  clearStateCookie,
} from '../utils/authCookie';
import type { AuthUserContext } from '../../types/rbac';
import { getEnabledProviders, isProviderEnabled } from '../utils/oauth';
import { getAppSource, getRefreshTokenFromCookies } from '../utils/appSource';

export default class AuthController extends CommonController {
  private async issueCookiesForUser(user: {
    _id: any;
    username: string;
    roles?: Array<{ _id?: any; slug?: string } | string>;
    groups?: Array<{ _id?: any; slug?: string } | string>;
    computedPermissions?: string[];
    extraPermissions?: string[];
  }) {
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

    // egg-passport may attach the authenticated user on ctx.user, ctx.state.user, or ctx.req.user when session=false
    /**
     *  Session true vs false (trade-offs)
    •  session: true
    •  Pros: Passport auto-populates ctx.user across middleware/handlers.
    •  Cons: Introduces server-side state (needs session store/sticky sessions), more cookies/CSRF surface, subdomain/domain
        config headaches, duplicates your JWT flow and can create conflicting auth sources.
    •  session: false
    •  Pros: Stateless (easier to scale), matches your JWT-based design (setAuthCookies, X-App-Source), one source of truth.
    •  Cons: User only lives on req.user during callback, so you must read ctx.req.user (we added fallbacks).
     */
    // if session is set false, passport will not serialize user into session, so we need to get user from ctx.req.user
    const user = (ctx as any).user || (ctx as any).state?.user || (ctx as any).req?.user;
    if (!user) {
      ctx.logger.warn('[oauth/callback] no user on context after passport', {
        provider: ctx.params.provider,
      });
      clearStateCookie(ctx);
      ctx.redirect('/login?err=oauth_user');
      return;
    }

    await this.issueCookiesForUser(user);
    clearStateCookie(ctx);
    const redirectTo = app.config.oauth?.baseUrl || '/';
    ctx.logger.debug('[oauth/callback] issuing cookies and redirect', {
      provider: ctx.params.provider,
      to: redirectTo,
    });
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
      const exp = (info as any)?.exp ? Number((info as any).exp) * 1000 : null;
      this.success({ authenticated: true, user, accessExp: exp });
      return;
    }
    this.success({ authenticated: false, user: null, accessExp: null });
  }

  // Explicit refresh endpoint: exchanges refresh token cookie for new access+refresh
  async refresh() {
    const { ctx, app } = this;
    try {
      const jwt = app.jwt;
      const secret = app.config.jwt?.secret;
      if (!jwt || !secret) return this.error('JWT not available');

      const refresh = getRefreshTokenFromCookies(ctx);
      if (!refresh) return this.error('缺少refresh token');
      const payload: any = await jwt.verify(refresh, secret);
      if (payload?.typ !== 'refresh' || !payload?.sub) return this.error('refresh token 类型错误');

      const user = await ctx.service.user.getAuthUserForTokens(payload.sub);
      const tokens = await ctx.service.user.generateTokens(user);
      setAuthCookies(ctx, tokens);
      const source = getAppSource(ctx);
      ctx.state.userinfo = { ...tokens.payload, authType: 'jwt', source } as AuthUserContext;
      let accessExp: number | null = null;
      try {
        const decoded: any = (app as any).jwt.decode(tokens.accessToken);
        if (decoded?.exp) accessExp = Number(decoded.exp) * 1000;
      } catch (e) {
        ctx.logger.debug('decode access token failed for exp', e);
      }
      this.success({ token: 'Bearer ' + tokens.accessToken, accessExp });
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
