import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import mongoConfig from './mongodb';
import { ConnectOptions } from 'mongoose';
import { baseRateLimitExemptPaths, defaultRateLimitRoutes } from 'doggy-nav-core';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // Use environment variables for critical secrets
  const JWT_SECRET = process.env.JWT_SECRET || 'a_strange_jwt_token_when_you_see_it';
  const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  const COOKIE_DOMAIN_MODE = (process.env.COOKIE_DOMAIN_MODE || 'auto').toLowerCase();
  const CORS_ORIGIN = process.env.CORS_ORIGIN;

  // Stable cookie signing key to prevent signed-cookie invalidation across restarts
  config.keys = process.env.COOKIE_KEYS || appInfo.name + '_doggy_nav_cookie_key';

  const allowedOrigins = CORS_ORIGIN ? CORS_ORIGIN.split(',') : ['http://localhost:3000'];

  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true,
    },
    xframe: {
      value: 'SAMEORIGIN',
    },
    hsts: {
      maxAge: 31536000,
      includeSubdomains: true,
    },
    csp: {
      policy: {
        'default-src': "'self'",
        'img-src': "'self' data:",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
      },
    },
    xssProtection: {
      value: '1; mode=block',
    },
    domainWhiteList: allowedOrigins,
  };

  config.cors = {
    origin: (ctx: any) => {
      const requestOrigin = ctx.get('origin');
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
    },
    credentials: true,
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
  };

  config.cluster = {
    listen: {
      port: parseInt(process.env.PORT || '3002', 10),
      hostname: '0.0.0.0',
    },
  };

  config.mongoose = {
    client: {
      url: mongoConfig.mongoUrl,
      options: { useNewUrlParser: true, useUnifiedTopology: true } as unknown as ConnectOptions,
    },
  };

  config.middleware = ['error', 'ioc', 'auth', 'rateLimit'];

  config.jwt = {
    secret: JWT_SECRET,
    accessExpiresIn: JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: JWT_REFRESH_EXPIRES_IN,
  };

  config.systemVersion = {
    enabled: process.env.SYSTEM_VERSION_ENABLED !== 'false',
    repoSlug: process.env.GIT_REPO_SLUG || 'MARVElOUS-DEV/doggy-nav',
    githubToken: process.env.GITHUB_TOKEN,
  };

  // Logger configuration for better diagnostics (tunable via env)
  config.logger = {
    dir: process.env.LOG_DIR || undefined,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'),
    consoleLevel:
      process.env.CONSOLE_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'WARN' : 'DEBUG'),
    // In Docker we want logs to stay on stdout/stderr instead of being silenced
    // after the app is ready, so keep console logging enabled.
    disableConsoleAfterReady: false,
  };

  const cookieConfig: any = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  // Only set a global domain when explicitly in fixed mode.
  if (COOKIE_DOMAIN && COOKIE_DOMAIN_MODE === 'fixed') {
    cookieConfig.domain = COOKIE_DOMAIN;
  }
  config.cookies = cookieConfig;

  // Trust proxy headers (X-Forwarded-*) so secure cookies work behind TLS-terminating proxies
  // Ensure your reverse proxy sets X-Forwarded-Proto and Host correctly
  config.proxy = process.env.NODE_ENV === 'production';

  config.oauth = {
    baseUrl: process.env.PUBLIC_BASE_URL || '',
    github: {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
      scope: ['read:user', 'user:email'],
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: ['openid', 'profile', 'email'],
    },
    linuxdo: {
      clientID: process.env.LINUXDO_CLIENT_ID || '',
      clientSecret: process.env.LINUXDO_CLIENT_SECRET || '',
      callbackURL: process.env.LINUXDO_CALLBACK_URL || '',
      authorizationURL: process.env.LINUXDO_AUTHORIZATION_URL || '',
      tokenURL: process.env.LINUXDO_TOKEN_URL || '',
      userProfileURL: process.env.LINUXDO_PROFILE_URL || '',
      scope: process.env.LINUXDO_SCOPE
        ? process.env.LINUXDO_SCOPE.split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined,
    },
  };

  config.invite = {
    requireForLocalRegister: process.env.REQUIRE_INVITE_CODE === 'true' || false,
    codeLength: 12,
  };

  // Rate limiting configuration
  const RATE_LIMIT_ENABLED_RAW = (process.env.RATE_LIMIT_ENABLED || '').toLowerCase();
  const RATE_LIMIT_ENABLED = RATE_LIMIT_ENABLED_RAW ? RATE_LIMIT_ENABLED_RAW === 'true' : false;
  const RATE_LIMIT_WHITELIST = process.env.RATE_LIMIT_WHITELIST
    ? process.env.RATE_LIMIT_WHITELIST.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const RATE_LIMIT_BLACKLIST = process.env.RATE_LIMIT_BLACKLIST
    ? process.env.RATE_LIMIT_BLACKLIST.split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  config.ratelimiter = {
    enable: true,
    limit: 100,
    interval: 60000,
    headers: true,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    keyGenerator: (ctx: any) => {
      const user = ctx.state && (ctx.state as any).userinfo;
      if (user && (user.userId || user.id)) {
        return `user:${user.userId || user.id}`;
      }
      return `ip:${ctx.ip}`;
    },
    whitelist: RATE_LIMIT_WHITELIST,
    blacklist: RATE_LIMIT_BLACKLIST,
  };

  // Advanced rate limiting configuration per user type
  config.rateLimit = {
    enabled: RATE_LIMIT_ENABLED,
    // Anonymous users (by IP)
    anonymous: {
      limit: parseInt(process.env.RATE_LIMIT_ANON || '100', 10),
      interval: 60000, // 1 minute
    },
    // Authenticated regular users
    authenticated: {
      limit: parseInt(process.env.RATE_LIMIT_AUTH || '200', 10),
      interval: 60000, // 1 minute
    },
    // Admin users
    admin: {
      limit: parseInt(process.env.RATE_LIMIT_ADMIN || '500', 10),
      interval: 60000, // 1 minute
    },
    // Per-route overrides for sensitive endpoints (shared across server & workers)
    routes: defaultRateLimitRoutes,
    // Health check exemption (shared defaults; workers may extend)
    exemptPaths: baseRateLimitExemptPaths,
    whitelist: RATE_LIMIT_WHITELIST,
    blacklist: RATE_LIMIT_BLACKLIST,
  };

  // URL Checker Configuration
  config.urlChecker = {
    // Enable/disable URL checking
    enabled: false,
    // Cron expression for scheduling checks (default: every 6 hours)
    cronExpression: '0 */6 * * *',
    // Maximum age for last check before rechecking (default: 1 hour)
    maxCheckAge: 60 * 60 * 1000,
    // Number of concurrent URL checks (default: 5)
    concurrentChecks: 5,
    // Batch size for processing nav items (default: 100)
    batchSize: 100,
    // Timeout for individual URL checks in milliseconds (default: 5 seconds)
    requestTimeout: 5000,
    // Auto-start timer on application startup
    autoStart: true,
  };

  // Client Secret Configuration
  config.clientSecret = {
    // Enable/disable client secret requirement for ALL APIs
    // When enabled, ALL API endpoints must include a valid client secret
    // When disabled, APIs work without client secret (legacy behavior)
    requireForAllAPIs: process.env.REQUIRE_CLIENT_SECRET === 'true' || false,
    // Header name for client secret (default: x-client-secret)
    headerName: 'x-client-secret',
    // Allow specific routes to bypass client secret requirement even when enabled
    // These are essential routes that should remain accessible for initial setup
    bypassRoutes: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/application/verify-client-secret',
      '/api/auth/:provider',
      '/api/auth/:provider/callback',
      '/api/auth/providers',
      '/api/auth/config',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/system/version',
    ],
  };

  return {
    ...config,
  };
};
