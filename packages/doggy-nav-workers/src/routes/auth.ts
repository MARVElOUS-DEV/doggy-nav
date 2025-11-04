import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { JWTUtils } from '../utils/jwtUtils';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../utils/responses';
import { getUser } from '../ioc/helpers';
import {
  setAuthCookies,
  clearAuthCookies,
  setStateCookie,
  getStateCookie,
  clearStateCookie,
  getAccessTokenFromCookies,
} from '../utils/cookieAuth';
import { D1OAuthRepository, type OAuthProvider } from '../adapters/d1OAuthRepository';
import { PasswordUtils } from '../utils/passwordUtils';

const authRoutes = new Hono<{
  Bindings: {
    DB: D1Database;
    JWT_SECRET?: string;
    ALLOWED_ORIGINS?: string;
    RATE_LIMIT_WINDOW_MS?: string | number;
    RATE_LIMIT_MAX?: string | number;
    PUBLIC_BASE_URL?: string;
    GITHUB_CLIENT_ID?: string;
    GITHUB_CLIENT_SECRET?: string;
    GITHUB_CALLBACK_URL?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    GOOGLE_CALLBACK_URL?: string;
    LINUXDO_CLIENT_ID?: string;
    LINUXDO_CLIENT_SECRET?: string;
    LINUXDO_CALLBACK_URL?: string;
    LINUXDO_AUTHORIZATION_URL?: string;
    LINUXDO_TOKEN_URL?: string;
    LINUXDO_PROFILE_URL?: string;
    LINUXDO_SCOPE?: string;
    REQUIRE_INVITE_CODE?: string;
  };
}>();

// Public routes (no authentication required)
authRoutes.post('/register', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.serverError('Server misconfigured: missing JWT secret'), 500);
    }
    const body = await c.req.json();
    const { username, email, password, nickName } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return c.json(responses.badRequest('Username, email, and password are required'), 400);
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json(
        responses.badRequest(`Password validation failed: ${passwordValidation.errors.join(', ')}`),
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(responses.badRequest('Invalid email format'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user already exists
    const existingUser = await userRepository.getByEmail(email);
    if (existingUser) {
      return c.json(responses.badRequest('User with this email already exists'), 409);
    }

    const existingUsername = await userRepository.getByUsername(username);
    if (existingUsername) {
      return c.json(responses.badRequest('Username already taken'), 409);
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(password);

    // Create user
    const newUser = await userRepository.create({
      username,
      email,
      passwordHash,
      nickName: nickName || '',
    });

    // Generate JWT tokens
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);
    const userPayload = JWTUtils.createPayload({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      roles: await userRepository.getUserRoles(newUser.id),
      groups: await userRepository.getUserGroups(newUser.id),
      permissions: newUser.extraPermissions,
    });

    const tokens = await jwtUtils.generateTokenPair(userPayload);
    // Set auth cookies for web clients
    setAuthCookies(c as any, tokens);

    return c.json(
      responses.ok(
        {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            nickName: newUser.nickName,
            roles: userPayload.roles,
            groups: userPayload.groups,
            permissions: userPayload.permissions,
          },
          tokens,
        },
        'User registered successfully'
      )
    );
  } catch (error) {
    console.error('Registration error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/login', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.serverError('Server misconfigured: missing JWT secret'), 500);
    }
    const body = await c.req.json();
    const { username, email, identifier, password } = body || {};
    const id = (identifier || email || username || '').toString();
    if (!id || !password) {
      return c.json(responses.badRequest('Username/email and password are required'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);
    type AuthRow = {
      id: string;
      username: string;
      email: string;
      isActive: boolean;
      passwordHash: string;
    };
    // Fetch auth row with password hash
    let authRow: AuthRow | null = null;
    if (email || id.includes('@')) authRow = await userRepository.getAuthByEmail(id.toLowerCase());
    if (!authRow) authRow = await userRepository.getAuthByUsername(id);

    if (!authRow) {
      return c.json(responses.badRequest('Invalid credentials'), 401);
    }
    if (!authRow.isActive) {
      return c.json(responses.badRequest('Account is deactivated'), 401);
    }
    const ok = await PasswordUtils.verifyPassword(password, authRow.passwordHash || '');
    if (!ok) return c.json(responses.badRequest('Invalid credentials'), 401);

    // Load full user and role/group slugs
    const [fullUser, roles, groups] = await Promise.all<
      [ReturnType<typeof userRepository.getById>, Promise<string[]>, Promise<string[]>]
    >([
      userRepository.getById(authRow.id),
      userRepository.getUserRoles(authRow.id),
      userRepository.getUserGroups(authRow.id),
    ]);
    if (!fullUser) return c.json(responses.serverError('User not found'), 500);

    // Enforce admin access for admin app source
    const src = (c.req.header('X-App-Source') || '').toLowerCase();
    if (src === 'admin') {
      const roleSet = new Set(roles);
      if (!(roleSet.has('admin') || roleSet.has('sysadmin'))) {
        return c.json(responses.err('权限不足'), 403);
      }
    }

    await userRepository.update(authRow.id, { lastLoginAt: new Date() });

    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);
    const userPayload = JWTUtils.createPayload({
      id: authRow.id,
      email: fullUser.email,
      username: fullUser.username,
      roles,
      groups,
      permissions: fullUser.extraPermissions,
    });
    const tokens = await jwtUtils.generateTokenPair(userPayload);
    setAuthCookies(c as any, tokens);

    return c.json(
      responses.ok(
        {
          token: 'Bearer ' + tokens.accessToken,
          tokens,
          user: {
            id: fullUser.id,
            username: fullUser.username,
            email: fullUser.email,
            nickName: fullUser.nickName,
            roles,
            groups,
            permissions: userPayload.permissions,
            avatar: fullUser.avatar,
          },
        },
        'Login successful'
      )
    );
  } catch (error) {
    console.error('Login error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/refresh', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.err('服务器配置错误: 缺少 JWT 密钥'));
    }
    const body = await c.req.json().catch(() => ({}));
    let refreshToken = body?.refreshToken;
    if (!refreshToken) {
      const { getRefreshTokenFromCookies } = await import('../utils/cookieAuth');
      refreshToken = getRefreshTokenFromCookies(c as any);
    }
    if (!refreshToken) {
      return c.json(responses.err('缺少refresh token'));
    }

    const userRepository = new D1UserRepository(c.env.DB);
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);

    const refreshPayload = await jwtUtils.verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      return c.json(responses.err('refresh token 类型错误'));
    }

    const user = await userRepository.getById(refreshPayload.userId);
    if (!user || !user.isActive) {
      return c.json(responses.err('用户不存在或已禁用'));
    }

    const userPayload = JWTUtils.createPayload({
      id: user.id,
      email: user.email,
      username: user.username,
      roles: await userRepository.getUserRoles(user.id),
      groups: await userRepository.getUserGroups(user.id),
      permissions: user.extraPermissions,
    });

    const newTokens = await jwtUtils.refreshAccessToken(refreshToken, userPayload);
    if (!newTokens) {
      return c.json(responses.err('刷新失败'));
    }

    setAuthCookies(c as any, newTokens);

    // Derive access token expiry (epoch ms)
    let accessExp: number | null = null;
    try {
      const payload = await jwtUtils.verifyAccessToken(newTokens.accessToken);
      accessExp = payload?.exp ? Number(payload.exp) * 1000 : null;
    } catch {}

    return c.json(responses.ok({ token: 'Bearer ' + newTokens.accessToken, accessExp }));
  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(responses.err('刷新失败'));
  }
});

authRoutes.post('/logout', async (c) => {
  try {
    clearAuthCookies(c as any);
    return c.body(null, 204);
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    let token = JWTUtils.extractTokenFromHeader(authHeader ?? null);
    if (!token) {
      const cookieToken = getAccessTokenFromCookies(c as any);
      if (cookieToken)
        token = cookieToken.startsWith('Bearer ') ? cookieToken.slice(7) : cookieToken;
    }

    if (!token || !c.env.JWT_SECRET) {
      return c.json(responses.ok({ authenticated: false, user: null, accessExp: null }));
    }

    const jwtUtils = new JWTUtils(c.env.JWT_SECRET);
    const payload = await jwtUtils.verifyAccessToken(token);
    if (!payload || JWTUtils.isTokenExpired(payload)) {
      return c.json(responses.ok({ authenticated: false, user: null, accessExp: null }));
    }

    const userRepo = new D1UserRepository(c.env.DB);
    const user = await userRepo.getById(payload.userId);
    if (!user || !user.isActive) {
      return c.json(responses.ok({ authenticated: false, user: null, accessExp: null }));
    }

    const accessExp = payload.exp ? Number(payload.exp) * 1000 : null;
    return c.json(
      responses.ok({ authenticated: true, user, accessExp }, 'User profile retrieved successfully')
    );
  } catch (error) {
    console.error('Profile error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.put('/me', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const body = await c.req.json();

    const userRepository = new D1UserRepository(c.env.DB);

    // Update user profile
    const updates: any = {};
    if (body.nickName !== undefined) updates.nickName = body.nickName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatar !== undefined) updates.avatar = body.avatar;

    const updatedUser = await userRepository.update(user.id, updates);

    if (!updatedUser) {
      return c.json(responses.badRequest('User not found'), 404);
    }

    return c.json(
      responses.ok(
        {
          user: {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            nickName: updatedUser.nickName,
            phone: updatedUser.phone,
            avatar: updatedUser.avatar,
          },
        },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/change-password', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json(responses.badRequest('Current password and new password are required'), 400);
    }

    const passwordValidation = PasswordUtils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return c.json(
        responses.badRequest(
          `New password validation failed: ${passwordValidation.errors.join(', ')}`
        ),
        400
      );
    }

    const userRepository = new D1UserRepository(c.env.DB);
    const currentUser = await userRepository.getById(user.id);

    if (!currentUser) {
      return c.json(responses.badRequest('User not found'), 404);
    }

    const isValidCurrentPassword = await PasswordUtils.verifyPassword(
      currentPassword,
      currentUser.passwordHash!
    );
    if (!isValidCurrentPassword) {
      return c.json(responses.badRequest('Current password is incorrect'), 400);
    }

    const newPasswordHash = await PasswordUtils.hashPassword(newPassword);
    await userRepository.update(user.id, { passwordHash: newPasswordHash });

    return c.json(responses.ok({}, 'Password changed successfully'));
  } catch (error) {
    console.error('Change password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(responses.badRequest('Email is required'), 400);
    }

    // In a real implementation, you would:
    // 1. Generate a password reset token
    // 2. Store it in the database with expiry
    // 3. Send an email with reset link
    // For now, we'll just return a success message

    return c.json(
      responses.ok({}, 'If an account with that email exists, a password reset link has been sent')
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return c.json(responses.badRequest('Reset token and new password are required'), 400);
    }

    const passwordValidation = PasswordUtils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return c.json(
        responses.badRequest(`Password validation failed: ${passwordValidation.errors.join(', ')}`),
        400
      );
    }

    // In a real implementation, you would:
    // 1. Verify the reset token
    // 2. Check if it's expired
    // 3. Update the user's password
    // For now, we'll just return a success message

    return c.json(responses.ok({}, 'Password reset successful'));
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

export { authRoutes, PasswordUtils };
// Additional server-compat endpoints

type ProviderConfig = {
  name: OAuthProvider;
  clientId: string;
  clientSecret: string;
  callbackURL: string;
  authorizationURL: string;
  tokenURL: string;
  userProfileURL: string;
  scope?: string[];
};

function randomState(): string {
  const arr = new Uint8Array(16);
  (globalThis.crypto || ({} as any)).getRandomValues?.(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getProvidersFromEnv(env: any): ProviderConfig[] {
  const list: ProviderConfig[] = [];
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.GITHUB_CALLBACK_URL) {
    list.push({
      name: 'github',
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token',
      userProfileURL: 'https://api.github.com/user',
      scope: ['read:user', 'user:email'],
    });
  }
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
    list.push({
      name: 'google',
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
      userProfileURL: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: ['openid', 'profile', 'email'],
    });
  }
  if (
    env.LINUXDO_CLIENT_ID &&
    env.LINUXDO_CLIENT_SECRET &&
    env.LINUXDO_CALLBACK_URL &&
    env.LINUXDO_AUTHORIZATION_URL &&
    env.LINUXDO_TOKEN_URL &&
    env.LINUXDO_PROFILE_URL
  ) {
    list.push({
      name: 'linuxdo',
      clientId: env.LINUXDO_CLIENT_ID,
      clientSecret: env.LINUXDO_CLIENT_SECRET,
      callbackURL: env.LINUXDO_CALLBACK_URL,
      authorizationURL: env.LINUXDO_AUTHORIZATION_URL,
      tokenURL: env.LINUXDO_TOKEN_URL,
      userProfileURL: env.LINUXDO_PROFILE_URL,
      scope: String(env.LINUXDO_SCOPE || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean) as string[] as string[],
    });
  }
  return list;
}

function getEnabledProviders(env: any): OAuthProvider[] {
  return getProvidersFromEnv(env).map((p) => p.name);
}

function getProviderConfig(env: any, name: string): ProviderConfig | undefined {
  const n = String(name || '').toLowerCase();
  return getProvidersFromEnv(env).find((p) => p.name === (n as OAuthProvider));
}

authRoutes.get('/providers', async (c) => {
  const providers = getEnabledProviders(c.env);
  return c.json(responses.ok({ providers }));
});

authRoutes.get('/config', async (c) => {
  const requireInviteForLocalRegister =
    String(c.env.REQUIRE_INVITE_CODE || '').toLowerCase() === 'true';
  return c.json(responses.ok({ requireInviteForLocalRegister }));
});

authRoutes.get('/:provider', async (c) => {
  const provider = c.req.param('provider');
  const cfg = getProviderConfig(c.env, provider);
  if (!cfg) return c.json(responses.notFound('Provider not configured'), 404);

  const state = randomState();
  setStateCookie(c as any, state);

  let authUrl = '';
  if (cfg.name === 'github') {
    const url = new URL(cfg.authorizationURL);
    url.searchParams.set('client_id', cfg.clientId);
    url.searchParams.set('redirect_uri', cfg.callbackURL);
    url.searchParams.set('state', state);
    if (cfg.scope?.length) url.searchParams.set('scope', cfg.scope.join(' '));
    authUrl = url.toString();
  } else if (cfg.name === 'google') {
    const url = new URL(cfg.authorizationURL);
    url.searchParams.set('client_id', cfg.clientId);
    url.searchParams.set('redirect_uri', cfg.callbackURL);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');
    if (cfg.scope?.length) url.searchParams.set('scope', cfg.scope.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    authUrl = url.toString();
  } else {
    // linuxdo or custom
    const url = new URL(cfg.authorizationURL);
    url.searchParams.set('client_id', cfg.clientId);
    url.searchParams.set('redirect_uri', cfg.callbackURL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    if (cfg.scope?.length) url.searchParams.set('scope', cfg.scope.join(' '));
    authUrl = url.toString();
  }

  return c.redirect(authUrl);
});

async function exchangeCode(
  cfg: ProviderConfig,
  code: string
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  if (cfg.name === 'github') {
    const resp = await fetch(cfg.tokenURL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: cfg.callbackURL,
      }),
    });
    const data: any = await resp.json().catch(() => ({}));
    const token = data?.access_token;
    if (!token) return null;
    return { accessToken: token };
  }
  if (cfg.name === 'google') {
    const body = new URLSearchParams();
    body.set('client_id', cfg.clientId);
    body.set('client_secret', cfg.clientSecret);
    body.set('code', code);
    body.set('redirect_uri', cfg.callbackURL);
    body.set('grant_type', 'authorization_code');
    const resp = await fetch(cfg.tokenURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data: any = await resp.json().catch(() => ({}));
    const token = data?.access_token;
    if (!token) return null;
    return { accessToken: token, refreshToken: data?.refresh_token };
  }
  // linuxdo/custom oauth2
  const body = new URLSearchParams();
  body.set('client_id', cfg.clientId);
  body.set('client_secret', cfg.clientSecret);
  body.set('code', code);
  body.set('redirect_uri', cfg.callbackURL);
  body.set('grant_type', 'authorization_code');
  const resp = await fetch(cfg.tokenURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data: any = await resp.json().catch(() => ({}));
  const token = data?.access_token;
  if (!token) return null;
  return { accessToken: token, refreshToken: data?.refresh_token };
}

async function fetchProfile(
  cfg: ProviderConfig,
  tokens: { accessToken: string }
): Promise<{
  provider: OAuthProvider;
  providerId: string;
  username?: string;
  displayName?: string;
  emails: Array<{ value?: string; verified?: boolean }>;
  avatar?: string;
  raw?: any;
} | null> {
  if (cfg.name === 'github') {
    const uResp = await fetch(cfg.userProfileURL, {
      headers: { Authorization: `Bearer ${tokens.accessToken}`, 'User-Agent': 'doggy-nav' },
    });
    const user: any = await uResp.json().catch(() => ({}));
    if (!user?.id) return null;
    // GitHub emails endpoint to get primary/verified email
    let emails: any[] = [];
    try {
      const eResp = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${tokens.accessToken}`, 'User-Agent': 'doggy-nav' },
      });
      emails = (await eResp.json()) as any[];
    } catch {}
    return {
      provider: 'github',
      providerId: String(user.id),
      username: user.login,
      displayName: user.name,
      emails: (emails || []).map((e: any) => ({
        value: e?.email || e?.value,
        verified: !!e?.verified,
      })),
      avatar: user.avatar_url,
      raw: user,
    };
  }
  if (cfg.name === 'google') {
    const resp = await fetch(cfg.userProfileURL, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    const prof: any = await resp.json().catch(() => ({}));
    if (!prof?.id && !prof?.email) return null;
    return {
      provider: 'google',
      providerId: String(prof.id || prof.sub || ''),
      username: prof.name,
      displayName: prof.name,
      emails: [{ value: prof.email, verified: !!prof.verified_email }],
      avatar: prof.picture,
      raw: prof,
    };
  }
  // linuxdo/custom profile assumed to follow OAuth2 Bearer userinfo pattern
  const resp = await fetch(cfg.userProfileURL, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  const prof: any = await resp.json().catch(() => ({}));
  if (!prof?.id) return null;
  return {
    provider: 'linuxdo',
    providerId: String(prof.id),
    username: prof.username ?? prof.displayName ?? 'linuxdo',
    displayName: prof.displayName ?? prof.username ?? 'LinuxDo User',
    emails: (prof.emails || []).map((e: any) => ({ value: e?.value, verified: e?.verified })),
    avatar: prof.photos?.[0]?.value || prof.avatar,
    raw: prof,
  };
}

async function findOrCreateFromProvider(
  c: any,
  profile: {
    provider: OAuthProvider;
    providerId: string;
    username?: string;
    displayName?: string;
    emails: Array<{ value?: string; verified?: boolean }>;
    avatar?: string;
  }
) {
  const userRepo = new D1UserRepository(c.env.DB);
  const linkRepo = new D1OAuthRepository(c.env.DB);
  // If link exists, return linked user
  const existing = await linkRepo.findByProviderUser(profile.provider, profile.providerId);
  if (existing) {
    const user = await userRepo.getById(existing.userId);
    if (user) return user;
  }

  // Try by email
  const email = profile.emails?.find((e) => !!e.value)?.value;
  let user = email ? await userRepo.getByEmail(email!) : null;

  if (!user) {
    // Create user with random password
    const base = (
      profile.username ||
      profile.displayName ||
      profile.provider + '_' + profile.providerId
    )
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, '_')
      .slice(0, 20);
    const suffix = Math.random().toString(36).slice(2, 6);
    const username = [base || profile.provider, suffix].join('_');
    const pwd = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const passwordHash = await PasswordUtils.hashPassword(pwd);
    user = await userRepo.create({
      username,
      email: email || `${profile.provider}_${profile.providerId}@example.com`,
      passwordHash,
      nickName: profile.displayName || profile.username || '',
      avatar: profile.avatar,
    });
  }

  await linkRepo.createLink({
    userId: user.id,
    provider: profile.provider,
    providerUserId: profile.providerId,
  });

  return user;
}

authRoutes.get('/:provider/callback', async (c) => {
  try {
    const provider = c.req.param('provider');
    const cfg = getProviderConfig(c.env, provider);
    if (!cfg) return c.json(responses.notFound('Provider not configured'), 404);

    const url = new URL(c.req.url);
    const code = url.searchParams.get('code');
    const queryState = url.searchParams.get('state') || '';
    const cookieState = getStateCookie(c as any);

    if (!cookieState || cookieState !== queryState) {
      clearAuthCookies(c as any);
      clearStateCookie(c as any);
      return c.redirect('/login?err=state');
    }

    if (!code) {
      clearStateCookie(c as any);
      return c.redirect('/login?err=code');
    }

    const tokenPair = await exchangeCode(cfg, code);
    if (!tokenPair) {
      clearStateCookie(c as any);
      return c.redirect('/login?err=oauth_exchange');
    }

    const prof = await fetchProfile(cfg, { accessToken: tokenPair.accessToken });
    if (!prof) {
      clearStateCookie(c as any);
      return c.redirect('/login?err=profile');
    }

    const user = await findOrCreateFromProvider(c as any, prof);

    // Generate JWT and set cookies
    if (!c.env.JWT_SECRET) return c.json(responses.serverError('Missing JWT secret'), 500);
    const userRepository = new D1UserRepository(c.env.DB);
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET);
    const payload = JWTUtils.createPayload({
      id: user.id,
      email: user.email,
      username: user.username,
      roles: await userRepository.getUserRoles(user.id),
      groups: await userRepository.getUserGroups(user.id),
      permissions: user.extraPermissions,
    });
    const tokens = await jwtUtils.generateTokenPair(payload);
    await userRepository.update(user.id, { lastLoginAt: new Date() });
    setAuthCookies(c as any, tokens);
    clearStateCookie(c as any);

    const redirectTo = c.env.PUBLIC_BASE_URL || '/';
    return c.redirect(redirectTo.startsWith('/') ? redirectTo : redirectTo);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return c.redirect('/login?err=oauth');
  }
});
