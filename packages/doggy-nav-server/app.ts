import { Application } from 'egg';
import { resolveSystemVersionInfo } from 'doggy-nav-core';
import { registerOAuthStrategies } from './app/utils/oauth';
import normalizePlugin from './app/utils/mongoose/normalize';

const COMMIT_ENV_KEYS = [
  'SERVER_COMMIT_ID',
  'GIT_COMMIT_SHA',
  'GIT_COMMIT',
  'VERCEL_GIT_COMMIT_SHA',
  'RAILWAY_GIT_COMMIT_SHA',
];

function resolveCurrentCommitId(): string | null {
  // In development/non-production, we don't care about real deploy version
  // and just surface a stable "dev" label.
  if (process.env.NODE_ENV !== 'production') {
    return 'dev';
  }

  // In production, the commit id must come from env, typically SERVER_COMMIT_ID
  // set by the deployment pipeline (Docker, Railway, etc.).
  for (const key of COMMIT_ENV_KEYS) {
    const value = process.env[key];
    if (value && typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function initSystemVersion(app: Application): Promise<void> {
  const cfg = app.config.systemVersion;
  const currentCommitId = resolveCurrentCommitId();
  const isProd = process.env.NODE_ENV === 'production';
  const enabled = isProd && cfg?.enabled !== false;

  try {
    app.systemVersion = await resolveSystemVersionInfo({
      enabled,
      repoSlug: cfg?.repoSlug,
      githubToken: cfg?.githubToken,
      currentCommitId,
    });
  } catch (e) {
    app.logger.warn('[systemVersion] resolveSystemVersionInfo failed', e);
    app.systemVersion = {
      currentCommitId,
      currentCommitTime: null,
      latestCommitId: null,
      latestCommitTime: null,
      hasNewVersion: false,
      checkedAt: new Date().toISOString(),
      error: 'RESOLVE_FAILED',
    };
  }
}

export default (app: Application) => {
  registerOAuthStrategies(app);

  // Apply global Mongoose schema normalization plugin
  if (app.mongoose) {
    app.mongoose.plugin(normalizePlugin as any);
  }

  app.beforeStart(async () => {
    app.logger.info('Application is starting...');
    app.logger.info(`Using MongoDB URL: ${app.config?.mongoose?.client?.url}`);
    await initSystemVersion(app);
  });

  app.ready(async () => {
    app.logger.info('Application is ready');

    // Start URL checker timer if enabled
    if (app.config.urlChecker.autoStart && app.config.urlChecker.enabled) {
      app.logger.info('Auto-starting URL checker timer');
      try {
        await app.createAnonymousContext().service.urlCheckerTimer.start();
      } catch (error) {
        app.logger.error('Failed to start URL checker timer:', error);
      }
    }
  });

  app.beforeClose(async () => {
    app.logger.info('Application is closing...');

    // Stop URL checker timer
    try {
      const ctx = app.createAnonymousContext();
      if (ctx.service.urlCheckerTimer) {
        ctx.service.urlCheckerTimer.stop();
      }
    } catch (error) {
      app.logger.error('Error stopping URL checker timer:', error);
    }
  });
};
