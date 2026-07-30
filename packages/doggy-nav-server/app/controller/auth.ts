import { randomBytes } from 'crypto';
import { URL } from 'url';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from '@simplewebauthn/server';
import CommonController from '../core/base_controller';
import { AuthenticationError, NotFoundError, ValidationError } from '../core/errors';
import {
  clearAuthCookies,
  setAuthCookies,
  setStateCookie,
  getStateCookie,
  clearStateCookie,
} from '../utils/authCookie';
import type { AuthUserContext } from '../../types/rbac';
import { getEnabledProviders, isProviderEnabled } from '../utils/oauth';
import {
  getAppSource,
  getRefreshTokenFromCookies,
  getAccessTokenFromCookies,
} from '../utils/appSource';

export default class AuthController extends CommonController {
  private getPasskeyConfig() {
    const { app, ctx } = this;
    const configuredOrigin = String((app.config as any).passkey?.origin || '').trim();
    const forwardedHost = ctx.get('X-Forwarded-Host').split(',')[0].trim();
    const forwardedProto = ctx.get('X-Forwarded-Proto').split(',')[0].trim();
    const host = forwardedHost || ctx.host;
    const origin = new URL(
      configuredOrigin || `${forwardedProto || ctx.protocol || 'http'}://${host}`
    );
    const rpID = String((app.config as any).passkey?.rpID || origin.hostname).trim();

    if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) {
      throw new ValidationError('Passkeys require HTTPS');
    }
    if (!rpID) throw new ValidationError('Passkey RP ID is not configured');

    return { origin: origin.origin, rpID };
  }

  private challengeCookieName(kind: 'login' | 'registration') {
    return `passkey_${kind}_challenge`;
  }

  private setPasskeyChallenge(kind: 'login' | 'registration', challenge: string) {
    this.ctx.cookies.set(this.challengeCookieName(kind), challenge, {
      httpOnly: true,
      maxAge: 5 * 60 * 1000,
      overwrite: true,
      sameSite: 'strict',
      secure: this.ctx.secure,
      signed: true,
    });
  }

  private consumePasskeyChallenge(kind: 'login' | 'registration') {
    const name = this.challengeCookieName(kind);
    const challenge = this.ctx.cookies.get(name);
    this.ctx.cookies.set(name, '', {
      httpOnly: true,
      maxAge: 0,
      overwrite: true,
      sameSite: 'strict',
      secure: this.ctx.secure,
      signed: true,
    });
    if (!challenge) throw new ValidationError('Passkey challenge expired; please try again');
    return challenge;
  }

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

  async listPasskeys() {
    const userId = this.ctx.state.userinfo?.userId;
    const user = await this.ctx.model.User.findById(userId).select('+passkeys').lean();
    if (!user) throw new NotFoundError('用户不存在');

    this.success(
      ((user as any).passkeys || []).map((passkey: any) => ({
        id: passkey._id,
        name: passkey.name,
        createdAt: passkey.createdAt,
        lastUsedAt: passkey.lastUsedAt,
      }))
    );
  }

  async registerPasskey() {
    const { ctx } = this;
    const userId = ctx.state.userinfo?.userId;
    const user = await ctx.model.User.findById(userId).select('+passkeys');
    if (!user) throw new NotFoundError('用户不存在');

    const response = ctx.request.body?.credential as RegistrationResponseJSON | undefined;
    const { origin, rpID } = this.getPasskeyConfig();

    if (!response) {
      const options = await generateRegistrationOptions({
        rpName: 'Doggy Nav',
        rpID,
        userID: new Uint8Array(Buffer.from(String(user._id))),
        userName: user.username,
        userDisplayName: user.username,
        attestationType: 'none',
        excludeCredentials: (user.passkeys || []).map((passkey: any) => ({
          id: passkey.credentialId,
          transports: passkey.transports,
        })),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });
      this.setPasskeyChallenge('registration', options.challenge);
      this.success(options);
      return;
    }

    const challenge = this.consumePasskeyChallenge('registration');
    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
      const credential = verification.registrationInfo?.credential;
      if (!verification.verified || !verification.registrationInfo || !credential) {
        throw new Error('Unverified registration');
      }

      const exists = await ctx.model.User.exists({
        'passkeys.credentialId': credential.id,
      });
      if (exists) throw new ValidationError('This passkey is already registered');

      const kind =
        response.authenticatorAttachment === 'cross-platform' ? 'Security key' : 'Passkey';
      user.passkeys.push({
        credentialId: credential.id,
        publicKey: Buffer.from(Array.from(credential.publicKey) as any),
        counter: credential.counter,
        transports: credential.transports || [],
        deviceType: verification.registrationInfo.credentialDeviceType,
        backedUp: verification.registrationInfo.credentialBackedUp,
        name: `${kind} ${user.passkeys.length + 1}`,
      });
      await user.save();
      this.success({ registered: true });
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      ctx.logger.warn('Passkey registration failed', error);
      throw new ValidationError('Passkey registration could not be verified');
    }
  }

  async deletePasskey() {
    const { ctx } = this;
    const result = await ctx.model.User.updateOne(
      { _id: ctx.state.userinfo?.userId, 'passkeys._id': ctx.params.id },
      { $pull: { passkeys: { _id: ctx.params.id } } }
    );
    if (!result.modifiedCount) throw new NotFoundError('Passkey not found');
    this.success({ deleted: true });
  }

  async passkeyLogin() {
    const { ctx } = this;
    const response = ctx.request.body?.credential as AuthenticationResponseJSON | undefined;
    const { origin, rpID } = this.getPasskeyConfig();

    if (!response) {
      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: 'required',
      });
      this.setPasskeyChallenge('login', options.challenge);
      this.success(options);
      return;
    }

    const challenge = this.consumePasskeyChallenge('login');
    try {
      if (!response.id) throw new Error('Missing credential ID');
      const user = await ctx.model.User.findOne({
        'passkeys.credentialId': response.id,
        isActive: true,
      }).select('+passkeys');
      const passkey = user?.passkeys?.find(
        (candidate: any) => candidate.credentialId === response.id
      );
      if (!user || !passkey) throw new Error('Unknown passkey');

      const credential: WebAuthnCredential = {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        transports: passkey.transports,
      };
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential,
        requireUserVerification: true,
      });
      if (!verification.verified) throw new Error('Unverified authentication');

      passkey.counter = verification.authenticationInfo.newCounter;
      passkey.lastUsedAt = new Date();
      await user.save();
      await this.issueCookiesForUser(user);
      this.success({ user: await ctx.service.user.getById(user._id) });
    } catch (error) {
      ctx.logger.warn('Passkey login failed', error);
      throw new AuthenticationError('Passkey login failed');
    }
  }

  async getAuthConfig() {
    const { app } = this;
    const inviteConfig = app.config.invite || {};
    this.success({
      requireInviteForLocalRegister: !!inviteConfig.requireForLocalRegister,
    });
  }

  // Returns access token for use with external services (e.g., image upload service)
  async getAccessToken() {
    const { ctx } = this;
    const token = getAccessTokenFromCookies(ctx);
    if (!token) {
      return this.error('Not authenticated');
    }
    this.success({ token });
  }
}
