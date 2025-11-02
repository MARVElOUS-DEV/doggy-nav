import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { secureHeaders } from 'hono/secure-headers';
import { GroupService } from 'doggy-nav-core';
import D1GroupRepository from './adapters/d1GroupRepository';
import { DataMigration } from './utils/dataMigration';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { roleRoutes } from './routes/roles';
import { categoryRoutes } from './routes/categories';
import { navRoutes } from './routes/nav';

type Env = {
  DB: D1Database;
  JWT_SECRET?: string;
  NODE_ENV?: string;
};

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', timing());
app.use('*', secureHeaders());

// CORS configuration
const corsOptions = {
  origin: (origin: string) => {
    // In production, replace with your actual domains
    const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000'];
    return allowedOrigins.includes(origin) ? origin : 'http://localhost:3001';
  },
  credentials: true,
};

app.use('/api/*', cors(corsOptions));

// Response helpers
export const responses = {
  ok: (data: any, message: string = 'ok') => ({ code: 1, msg: message, data }),
  err: (message: string, code: number = 0) => ({ code, msg: message, data: null }),
  notFound: (message: string = 'Resource not found') => responses.err(message, 404),
  badRequest: (message: string = 'Bad request') => responses.err(message, 400),
  serverError: (message: string = 'Internal server error') => responses.err(message, 500),
};

// Error handling middleware
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(responses.serverError(process.env.NODE_ENV === 'development' ? err.message : undefined), 500);
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json(responses.ok({ status: 'healthy', timestamp: new Date().toISOString() }));
});

// API Routes

// Group Management
const groupRoutes = new Hono<{ Bindings: Env }>();

groupRoutes.get('/', async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? 50), 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? 1), 1);

    const service = new GroupService(new D1GroupRepository(c.env.DB));
    const result = await service.list({ pageSize, pageNumber });

    return c.json(responses.ok(result));
  } catch (error) {
    console.error('Group list error:', error);
    return c.json(responses.serverError(), 500);
  }
});

groupRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const service = new GroupService(new D1GroupRepository(c.env.DB));
    const data = await service.getOne(id);

    if (!data) {
      return c.json(responses.notFound('Group not found'), 404);
    }

    return c.json(responses.ok({ data }));
  } catch (error) {
    console.error('Group detail error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Data Migration Routes (protected in production)
const migrationRoutes = new Hono<{ Bindings: Env }>();

migrationRoutes.post('/migrate', async (c) => {
  try {
    const migration = new DataMigration(c.env.DB);

    // Reset existing data (development only)
    if (process.env.NODE_ENV === 'development') {
      await migration.resetAllData();
    }

    // Here you would call migration methods with actual MongoDB data
    // For now, we'll just return migration status
    const stats = await migration.getMigrationStats();

    return c.json(responses.ok({
      message: 'Migration completed successfully',
      stats
    }));
  } catch (error) {
    console.error('Migration error:', error);
    return c.json(responses.serverError(), 500);
  }
});

migrationRoutes.get('/validate', async (c) => {
  try {
    const migration = new DataMigration(c.env.DB);
    const validation = await migration.validateMigration();

    return c.json(responses.ok({
      valid: validation.valid,
      errors: validation.errors
    }));
  } catch (error) {
    console.error('Validation error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/roles', roleRoutes);
app.route('/api/category', categoryRoutes);
app.route('/api/nav', navRoutes);
app.route('/api/groups', groupRoutes);
app.route('/api/migration', migrationRoutes);

// 404 handler for unmatched routes
app.notFound((c) => {
  return c.json(responses.err('Endpoint not found'), 404);
});

export default app;