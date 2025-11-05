import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';
import { registerRoutes, Env as RouteEnv } from './routes';
import { createWorkerContainer } from './ioc/worker';
import { responses } from './utils/responses';
import { rateLimit } from './middleware/rateLimit';
import { sourceGuard } from './middleware/sourceGuard';
import { publicRoute } from './middleware/auth';
import { accessControl } from './middleware/accessControl';
import { clientSecretGuard } from './middleware/clientSecretGuard';

type Env = RouteEnv;
const app = new Hono<{ Bindings: RouteEnv }>();

// Global middleware
app.use('*', logger());
app.use('*', timing());
app.use('*', secureHeaders());
app.use('*', async (c, next) => {
  const di = createWorkerContainer({ DB: c.env.DB });
  c.set('di', di);
  await next();
});

// CORS configuration (env-driven allowlist); if origin not allowed, do not set ACAO
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  const patterns = (c.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const allowed = patterns.length > 0 && patterns.includes(origin);
  if (!allowed) return next();
  return cors({ origin, credentials: true })(c, next);
});

// Basic rate limit
app.use('/api/*', rateLimit());

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json(responses.ok({ status: 'healthy', timestamp: new Date().toISOString() }));
});

// Enforce source header and admin-source auth gating (server parity)
app.use('/api/*', sourceGuard());

// Enforce client secret when enabled (server parity)
app.use('/api/*', clientSecretGuard());

// Populate optional auth context for downstream access checks (non-blocking)
app.use('/api/*', publicRoute());

// Centralized access control matrix enforcement (server parity)
app.use('/api/*', accessControl());

// Error handling middleware
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(responses.serverError(), 500);
});

// Register App Routes in a single place
registerRoutes(app);

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json(responses.err('Endpoint not found'), 404);
});

export default app;

// Expose a factory for tests to bind environment to requests
export function createApp(bindings: Env) {
  const anyApp = app as any;
  anyApp.request = (input: RequestInfo, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input as any, init);
    return app.fetch(req, bindings);
  };
  return app;
}
