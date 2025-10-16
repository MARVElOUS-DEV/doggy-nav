import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import mongoConfig from './mongodb';
import { ConnectOptions } from 'mongoose';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;

  // Use environment variables for critical secrets
  const JWT_SECRET = process.env.JWT_SECRET || 'a_strange_jwt_token_when_you_see_it';
  const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
  const CORS_ORIGIN = process.env.CORS_ORIGIN;

  config.keys = appInfo.name + '_' + Math.random().toString(36).substr(2, 8);

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
        'default-src': '\'self\'',
        'img-src': '\'self\' data:',
        'script-src': '\'self\' \'unsafe-inline\'',
        'style-src': '\'self\' \'unsafe-inline\'',
      },
    },
    xssProtection: {
      value: '1; mode=block',
    },
    domainWhiteList: CORS_ORIGIN ? CORS_ORIGIN.split(',') : [ 'http://localhost:3000' ],
  };

  config.cors = {
    origin: CORS_ORIGIN ? CORS_ORIGIN.split(',') : [ 'http://localhost:3000' ],
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

  config.middleware = [ 'error', 'auth' ];

  config.jwt = {
    secret: JWT_SECRET,
  };
  (config.jwt as any).accessExpiresIn = JWT_ACCESS_EXPIRES_IN;
  (config.jwt as any).refreshExpiresIn = JWT_REFRESH_EXPIRES_IN;

  const cookieConfig: any = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  if (COOKIE_DOMAIN) {
    cookieConfig.domain = COOKIE_DOMAIN;
  }
  config.cookies = cookieConfig;

  config.oauth = {
    baseUrl: process.env.PUBLIC_BASE_URL || '',
    github: {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
      scope: [ 'read:user', 'user:email' ],
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
      scope: [ 'openid', 'profile', 'email' ],
    },
  };

  // Route access control is now handled by the access-control.js configuration
  // config.routerAuth is deprecated

  // Rate limiting configuration
  config.ratelimiter = {
    enable: process.env.NODE_ENV === 'production',
    limit: 100,
    interval: 60000,
    headers: true,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    keyGenerator: (ctx: any) => {
      return ctx.ip;
    },
    whitelist: [],
    blacklist: [],
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
      '/api/register',
      '/api/login',
      '/api/application/verify-client-secret',
      '/api/auth/:provider',
      '/api/auth/:provider/callback',
      '/api/auth/providers',
      '/api/auth/me',
      '/api/auth/logout',
    ],
  };

  return {
    ...config,
  };
};
