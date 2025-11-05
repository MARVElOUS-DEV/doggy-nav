import { Hono } from 'hono';
import { createAuthMiddleware, requireRole } from '../middleware/auth';
import { DataMigration } from '../utils/dataMigration';
import { responses } from '../utils/responses';

type Env = { DB: D1Database; NODE_ENV?: string };

export const migrationRoutes = new Hono<{ Bindings: Env }>();

migrationRoutes.post('/migrate', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    if (c.env.NODE_ENV === 'production') {
      return c.json(responses.err('Migration endpoints are disabled in production'), 403);
    }
    const migration = new DataMigration(c.env.DB);

    if ((c.env.NODE_ENV || '').toLowerCase() === 'development') {
      await migration.resetAllData();
    }

    const stats = await migration.getMigrationStats();

    return c.json(responses.ok({
      message: 'Migration completed successfully',
      stats,
    }));
  } catch (error) {
    console.error('Migration error:', error);
    return c.json(responses.serverError(), 500);
  }
});

migrationRoutes.get('/validate', createAuthMiddleware({ required: true }), requireRole('sysadmin'), async (c) => {
  try {
    if (c.env.NODE_ENV === 'production') {
      return c.json(responses.err('Migration endpoints are disabled in production'), 403);
    }
    const migration = new DataMigration(c.env.DB);
    const validation = await migration.validateMigration();

    return c.json(responses.ok({
      valid: validation.valid,
      errors: validation.errors,
    }));
  } catch (error) {
    console.error('Validation error:', error);
    return c.json(responses.serverError(), 500);
  }
});
