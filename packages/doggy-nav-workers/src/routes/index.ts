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
import compatRoutes from './compat';
import emailSettingsRoutes from './emailSettings';
import urlCheckerRoutes from './urlChecker';
import applicationRoutes from './application';
import translateRoutes from './translate';
import seedRoutes from './seed';

export type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_WINDOW_MS?: string | number;
  RATE_LIMIT_MAX?: string | number;
  REQUIRE_CLIENT_SECRET?: string; // 'true' to enable
  CLIENT_SECRET_HEADER?: string; // default 'x-client-secret'
  CLIENT_SECRET_BYPASS?: string; // comma-separated paths
};

export function registerRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api/auth', authRoutes);
  // Server-compat shortcuts under /api
  app.route('/api', compatRoutes);
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
  app.route('/api/migration', migrationRoutes);
  app.route('/api/seed', seedRoutes);
}
