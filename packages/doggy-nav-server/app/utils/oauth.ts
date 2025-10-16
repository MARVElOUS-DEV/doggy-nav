import { Application } from 'egg';
import GitHubStrategy from 'passport-github2';
import GoogleStrategy from 'passport-google-oauth20';
import { ConflictError } from '../core/errors';

type ProviderName = 'github' | 'google';

export type ProviderSpec = {
  name: ProviderName;
  Strategy: any;
  enabled: boolean;
  config: any;
  mapProfile: (profile: any) => {
    provider: ProviderName;
    providerId: string;
    username?: string;
    displayName?: string;
    emails: Array<{ value?: string; verified?: boolean }>; // required by user service
    avatar?: string | undefined;
    raw?: any;
  };
};

export function listProviders(app: Application): ProviderSpec[] {
  const oauthConfig = (app.config as any).oauth as any;
  return [
    {
      name: 'github',
      Strategy: GitHubStrategy,
      config: oauthConfig?.github,
      enabled: !!(oauthConfig?.github?.clientID && oauthConfig?.github?.clientSecret && oauthConfig?.github?.callbackURL),
      mapProfile: (profile) => ({
        provider: 'github',
        providerId: profile.id,
        username: profile.username,
        displayName: profile.displayName,
        emails: (profile.emails || []).map((e: any) => ({ value: e?.value, verified: e?.verified })),
        avatar: profile.photos?.[0]?.value,
        raw: profile,
      }),
    },
    {
      name: 'google',
      Strategy: GoogleStrategy,
      config: oauthConfig?.google,
      enabled: !!(oauthConfig?.google?.clientID && oauthConfig?.google?.clientSecret && oauthConfig?.google?.callbackURL),
      mapProfile: (profile) => ({
        provider: 'google',
        providerId: profile.id,
        username: profile.displayName,
        displayName: profile.displayName,
        emails: (profile.emails || []).map((e: any) => ({ value: e?.value, verified: e?.verified })),
        avatar: profile.photos?.[0]?.value,
        raw: profile,
      }),
    },
  ];
}

export function getEnabledProviders(app: Application): ProviderName[] {
  return listProviders(app).filter(p => p.enabled).map(p => p.name);
}

export function isProviderEnabled(app: Application, provider: string): provider is ProviderName {
  return getEnabledProviders(app).includes(provider as ProviderName);
}

export function registerOAuthStrategies(app: Application) {
  const { logger } = app;
  const passport = (app as any).passport;
  if (!passport) {
    logger.warn('[oauth] Missing oauth configuration or passport, skipping strategy registration');
    return;
  }
  const providers: ProviderSpec[] = listProviders(app);

  for (const p of providers) {
    if (!p.enabled) {
      logger.warn(`[oauth] ${p.name} credentials missing, ${p.name} OAuth disabled`);
      continue;
    }

    passport.use(new p.Strategy(p.config, async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (err: any, user?: any, info?: any) => void,
    ) => {
      try {
        const ctx = app.createAnonymousContext();
        const user = await ctx.service.user.findOrCreateFromProvider(p.mapProfile(profile));
        return done(null, user);
      } catch (error) {
        if (error instanceof ConflictError) {
          return done(null, false, { message: (error as Error).message, code: 'conflict' });
        }
        logger.error(`[oauth:${p.name}] Failed to process profile`, error);
        return done(error as Error);
      }
    }));
  }

  passport.verify(async (_ctx: any, user: any) => user);
  passport.serializeUser(async (_ctx: any, user: any) => user);
  passport.deserializeUser(async (_ctx: any, user: any) => user);
}
