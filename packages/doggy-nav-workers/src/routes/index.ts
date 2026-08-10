import type { Hono } from 'hono';
import { authRoutes } from './auth';
import { userRoutes } from './users';
import { roleRoutes } from './roles';
import { categoryRoutes } from './categories';
import { navRoutes } from './nav';
import { tagRoutes } from './tags';
import { inviteCodeRoutes } from './inviteCode';
import { favoriteRoutes } from './favorite';
import { groupRoutes } from './groups';
import { migrationRoutes } from './migration';
import emailSettingsRoutes from './emailSettings';
import urlCheckerRoutes from './urlChecker';
import applicationRoutes from './application';
import translateRoutes from './translate';
import seedRoutes from './seed';
import aiRoutes from './ai';
import promptRoutes from './prompt';
import aiProviderRoutes from './aiProviders';
import systemRoutes from './system';
import afficheRoutes from './affiche';
import siteSettingsRoutes from './siteSettings';
import imageRoutes from './images';
import toolOutputRoutes from './toolOutputs';
import paymentRoutes from './payments';
import passkeyRoutes from './passkeys';

export type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  IMAGE_SERVICE_URL?: string;
  NODE_ENV?: string;
  AI_BOOKMARK_ORGANIZE_DEBUG?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_ENABLED?: string;
  RATE_LIMIT_WINDOW_MS?: string | number;
  RATE_LIMIT_MAX?: string | number;
  REQUIRE_CLIENT_SECRET?: string; // 'true' to enable
  CLIENT_SECRET_HEADER?: string; // default 'x-client-secret'
  CLIENT_SECRET_BYPASS?: string; // comma-separated paths
  // System version / repo metadata
  SERVER_COMMIT_ID?: string;
  GIT_COMMIT_SHA?: string;
  GIT_COMMIT?: string;
  CF_PAGES_COMMIT_SHA?: string;
  GIT_REPO_SLUG?: string;
  SYSTEM_VERSION_ENABLED?: string;
  GITHUB_TOKEN?: string;
  TOOL_OUTPUT_REQUIRE_HTTPS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_SUPPORT_BASE_URL?: string;
  STRIPE_SUPPORT_SUCCESS_URL?: string;
  STRIPE_SUPPORT_CANCEL_URL?: string;
  STRIPE_SUPPORT_CREATOR_NAME?: string;
  PASSKEY_ORIGIN?: string;
  PASSKEY_RP_ID?: string;
  PUBLIC_BASE_URL?: string;
};

export function registerRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api', passkeyRoutes);
  app.route('/api/auth', authRoutes);
  app.route('/api/users', userRoutes);
  // Server-compat alias (server uses singular /api/user)
  app.route('/api/user', userRoutes);
  app.route('/api/roles', roleRoutes);
  app.route('/api/category', categoryRoutes);
  app.route('/api/nav', navRoutes);
  app.route('/api/tag', tagRoutes);
  app.route('/api/inviteCode', inviteCodeRoutes);
  // Server-compat paths
  app.route('/api/invite-codes', inviteCodeRoutes);
  app.route('/api/favorite', favoriteRoutes);
  app.route('/api/favorites', favoriteRoutes);
  app.route('/api/groups', groupRoutes);
  app.route('/api/email-settings', emailSettingsRoutes);
  app.route('/api/url-checker', urlCheckerRoutes);
  app.route('/api/application', applicationRoutes);
  app.route('/api/translate', translateRoutes);
  app.route('/api/prompts', promptRoutes);
  app.route('/api/ai-providers', aiProviderRoutes);
  app.route('/api/affiches', afficheRoutes);
  app.route('/api/site-settings', siteSettingsRoutes);
  app.route('/api/tool-outputs', toolOutputRoutes);
  app.route('/api/payments', paymentRoutes);
  app.route('/api/images', imageRoutes);
  app.route('/api/migration', migrationRoutes);
  app.route('/api/seed', seedRoutes);
  app.route('/api/system', systemRoutes);
  // OpenAI-compatible inference endpoint
  app.route('/', aiRoutes);
}
