import { randomBytes } from 'crypto';
import Controller from '../core/base_controller';
import { clearAuthCookies, setAuthCookies, setStateCookie, getStateCookie, clearStateCookie } from '../utils/authCookie';
import { getEnabledProviders, isProviderEnabled } from '../utils/oauth';

export default class AuthController extends Controller {
  private async issueCookiesForUser(user: any) {
    const { ctx } = this;
    const tokens = await ctx.service.user.generateTokens(user);
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
      clearStateCookie(ctx);
      ctx.redirect('/login?err=oauth_user');
      return;
    }

    await this.issueCookiesForUser(user);
    clearStateCookie(ctx);
    const redirectTo = app.config.oauth?.baseUrl || '/';
    ctx.redirect(redirectTo);
  }

  async me() {
    const { ctx, app } = this;
    let token = ctx.cookies.get('access_token');
    if (!token) {
      const authHeader = ctx.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (authHeader) {
        token = authHeader;
      }
    }

    if (!token) {
      this.success({ authenticated: false, user: null });
      return;
    }

    try {
      const payload = await app.jwt.verify(token, app.config.jwt.secret) as any;
      const user = await ctx.service.user.getById(payload.userId);
      this.success({ authenticated: true, user });
    } catch (error) {
      ctx.logger.warn('[auth/me] access token invalid', error);
      clearAuthCookies(ctx);
      this.success({ authenticated: false, user: null });
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
}
