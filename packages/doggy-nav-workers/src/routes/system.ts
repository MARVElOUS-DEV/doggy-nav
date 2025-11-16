import { Hono } from 'hono';
import type { Env } from './index';
import { responses } from '../utils/responses';
import { resolveSystemVersionInfo } from 'doggy-nav-core';

const systemRoutes = new Hono<{ Bindings: Env }>();

systemRoutes.get('/version', async (c) => {
  try {
    const env = c.env;
    const nodeEnv = env.NODE_ENV || 'development';
    const isProd = nodeEnv === 'production';
    const enabled =
      isProd && String(env.SYSTEM_VERSION_ENABLED ?? 'true').toLowerCase() !== 'false';

    const currentCommitId = isProd
      ? env.SERVER_COMMIT_ID ||
        env.GIT_COMMIT_SHA ||
        env.GIT_COMMIT ||
        env.CF_PAGES_COMMIT_SHA ||
        null
      : 'dev';

    const info = await resolveSystemVersionInfo({
      enabled,
      repoSlug: env.GIT_REPO_SLUG || 'MARVElOUS-DEV/doggy-nav',
      githubToken: env.GITHUB_TOKEN,
      currentCommitId,
    });

    return c.json(responses.ok(info));
  } catch (err) {
    console.error('Worker system version error:', err);
    return c.json(responses.serverError(), 500);
  }
});

export default systemRoutes;
