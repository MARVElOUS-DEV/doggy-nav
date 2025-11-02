import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';
import { responses } from './index';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { roleRoutes } from './routes/roles';
import { categoryRoutes } from './routes/categories';
import { navRoutes } from './routes/nav';
import { tagRoutes } from './routes/tags';
import { inviteCodeRoutes } from './routes/inviteCode';

type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
};

export function createApp(bindings: Env) {
  const app = new Hono<{ Bindings: Env }>();
  app.use('*', logger());
  app.use('*', timing());
  app.use('*', secureHeaders());

  const corsOptions = {
    origin: () => 'http://localhost:3001',
    credentials: true,
  };
  app.use('/api/*', cors(corsOptions));

  app.get('/api/health', (c) => c.json(responses.ok({ status: 'healthy', timestamp: new Date().toISOString() })));

  app.route('/api/auth', authRoutes);
  app.route('/api/users', userRoutes);
  app.route('/api/roles', roleRoutes);
  app.route('/api/category', categoryRoutes);
  app.route('/api/nav', navRoutes);
  app.route('/api/tag', tagRoutes);
  app.route('/api/inviteCode', inviteCodeRoutes);

  const anyApp = app as any;
  anyApp.request = (input: RequestInfo, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input as any, init);
    return app.fetch(req, bindings);
  };
  return app;
}
