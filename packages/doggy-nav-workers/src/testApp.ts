import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';
import { responses } from './utils/responses';
import { registerRoutes } from './routes';
import { rateLimit } from './middleware/rateLimit';
import { sourceGuard } from './middleware/sourceGuard';
import { clientSecretGuard } from './middleware/clientSecretGuard';
import { publicRoute } from './middleware/auth';
import { accessControl } from './middleware/accessControl';
import { createWorkerContainer } from './ioc/worker';
import { Env } from './types/hono-env';

function createApp(bindings: Env) {
  const app = new Hono<{ Bindings: Env }>();
  app.use('*', logger());
  app.use('*', timing());
  app.use('*', secureHeaders());
  // Set up DI container like in the main app
  app.use('*', async (c, next) => {
    const di = createWorkerContainer({ DB: c.env.DB });
    c.set('di', di);
    await next();
  });

  // Health check endpoint
  app.get('/api/health', (c) =>
    c.json(responses.ok({ status: 'healthy', timestamp: new Date().toISOString() }))
  );

  // CORS configuration (simplified for testing)
  app.use('/api/*', cors({ origin: 'http://localhost:3001', credentials: true }));

  // Apply same middlewares as main app
  app.use('/api/*', rateLimit());
  app.use('/api/*', sourceGuard());
  app.use('/api/*', clientSecretGuard());
  app.use('/api/*', publicRoute());
  app.use('/api/*', accessControl());

  // Register all routes like in main app
  registerRoutes(app);

  // 404 handler
  app.notFound((c) => {
    return c.json(responses.err('Endpoint not found'), 404);
  });

  const anyApp = app as any;
  anyApp.request = (input: RequestInfo, init?: RequestInit) => {
    // Ensure the URL is absolute for testing
    const url = typeof input === 'string' && !input.startsWith('http')
      ? `http://localhost${input}`
      : input;
    const req = input instanceof Request ? input : new Request(url as any, init);
    return app.fetch(req, bindings);
  };
  return app;
}

export default createApp;
