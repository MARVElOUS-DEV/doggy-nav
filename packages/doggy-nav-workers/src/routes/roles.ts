import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission } from '../middleware/auth';
import { TOKENS } from '../ioc/tokens';
import { getDI, getUser } from '../ioc/helpers';
import { responses } from '../utils/responses';
import type { RoleService } from 'doggy-nav-core';

const roleRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

roleRoutes.get(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('role:read'),
  async (c) => {
    try {
      const pageSize = Math.min(
        Math.max(Number(c.req.query('pageSize') ?? c.req.query('limit') ?? 50) || 50, 1),
        100
      );
      const pageNumber = Math.max(
        Number(c.req.query('pageNumber') ?? c.req.query('page') ?? 1) || 1,
        1
      );
      const isSystem = c.req.query('isSystem');
      const user = getUser(c);
      // Prefer core RoleService for listing; fall back to repo only when isSystem filter is explicitly used
      if (typeof isSystem === 'undefined') {
        const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
        const result = await svc.list({ pageSize, pageNumber }, user as any);
        return c.json(responses.ok(result));
      } else {
        const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;
        const result = await roleRepository.list({
          pageSize,
          pageNumber,
          filter: { isSystem: isSystem === 'true' },
        });
        return c.json(
          responses.ok({ data: result.data, total: result.total, pageNumber: result.pageNumber })
        );
      }
    } catch (error) {
      console.error('Get roles error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.get(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('role:read'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      const role = await svc.getById(id);

      if (!role) {
        return c.json(responses.notFound('Role not found'), 404);
      }

      return c.json(
        responses.ok(
          {
            role,
          },
          'Role retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get role error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.get(
  '/slug/:slug',
  createAuthMiddleware({ required: true }),
  requirePermission('role:read'),
  async (c) => {
    try {
      const { slug } = c.req.param();
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      const role = await svc.getBySlug(slug);

      if (!role) {
        return c.json(responses.notFound('Role not found'), 404);
      }

      return c.json(
        responses.ok(
          {
            role,
          },
          'Role retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get role by slug error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.post(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('role:create'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { slug, displayName, description, permissions, isSystem } = body;
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      try {
        const newRole = await svc.create({
          slug,
          displayName,
          description,
          permissions,
          isSystem,
        });
        return c.json(responses.ok(newRole), 201);
      } catch (e: any) {
        if (e?.name === 'ValidationError') {
          const msg = String(e.message || 'Invalid input');
          const code = /already exists/i.test(msg) ? 409 : 400;
          return c.json(code === 400 ? responses.badRequest(msg) : responses.badRequest(msg), code);
        }
        throw e;
      }
    } catch (error) {
      console.error('Create role error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.put(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('role:update'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      try {
        const updatedRole = await svc.update(id, {
          displayName: body.displayName,
          description: body.description,
          permissions: Array.isArray(body.permissions)
            ? body.permissions
            : typeof body.permissions === 'string'
              ? body.permissions.split(',').map((s: string) => s.trim()).filter(Boolean)
              : undefined,
          isSystem: body.isSystem,
        });
        if (!updatedRole) return c.json(responses.notFound('Role not found'), 404);
        return c.json(responses.ok(updatedRole));
      } catch (e: any) {
        if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
        throw e;
      }
    } catch (error) {
      console.error('Update role error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Server-compat: PUT /api/roles (body.id)
roleRoutes.put(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('role:update'),
  async (c) => {
    try {
      const body = await c.req.json();
      const { id, displayName, description, permissions, isSystem } = body || {};
      if (!id) return c.json(responses.badRequest('id required'), 400);
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      try {
        const updatedRole = await svc.update(id, {
          displayName,
          description,
          permissions: Array.isArray(permissions)
            ? permissions
            : typeof permissions === 'string'
              ? permissions.split(',').map((s: string) => s.trim()).filter(Boolean)
              : undefined,
          isSystem,
        });
        if (!updatedRole) return c.json(responses.notFound('Role not found'), 404);
        return c.json(responses.ok(updatedRole));
      } catch (e: any) {
        if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
        throw e;
      }
    } catch (error) {
      console.error('Update role (compat) error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.delete(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('role:delete'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      try {
        const ok = await svc.delete(id);
        if (!ok) return c.json(responses.notFound('Role not found'), 404);
        return c.json(responses.ok({}, 'Role deleted successfully'));
      } catch (e: any) {
        if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
        throw e;
      }
    } catch (error) {
      console.error('Delete role error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Server-compat: DELETE /api/roles (body.id)
roleRoutes.delete(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('role:delete'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const id = body?.id;
      const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;

      if (ids.length > 0) {
        let ok = true;
        for (const rid of ids) {
          try {
            const deleted = await svc.delete(rid);
            ok = ok && deleted;
          } catch {
            ok = false;
          }
        }
        return c.json(
          ok ? responses.ok({}) : responses.serverError('Failed to delete some roles'),
          ok ? 200 : 500
        );
      }

      if (!id) return c.json(responses.badRequest('id or ids required'), 400);
      let deleted = false;
      try {
        deleted = await svc.delete(id);
      } catch (e: any) {
        if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
        throw e;
      }
      return c.json(
        deleted ? responses.ok({}) : responses.serverError('Failed to delete role'),
        deleted ? 200 : 500
      );
    } catch (error) {
      console.error('Delete role (compat) error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.get(
  '/:id/permissions',
  createAuthMiddleware({ required: true }),
  requirePermission('role:read'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      const role = await svc.getById(id);
      if (!role) {
        return c.json(responses.notFound('Role not found'), 404);
      }

      const permissions = await svc.getPermissions(id);

      return c.json(
        responses.ok(
          {
            permissions,
          },
          'Role permissions retrieved successfully'
        )
      );
    } catch (error) {
      console.error('Get role permissions error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

roleRoutes.put(
  '/:id/permissions',
  createAuthMiddleware({ required: true }),
  requirePermission('role:update'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const { permissions } = body;

      if (!Array.isArray(permissions)) {
        return c.json(responses.badRequest('permissions must be an array'), 400);
      }

      const svc = getDI(c).resolve(TOKENS.RoleService) as RoleService;
      const role = await svc.getById(id);
      if (!role) {
        return c.json(responses.notFound('Role not found'), 404);
      }

      await svc.setPermissions(id, permissions);

      return c.json(responses.ok({}, 'Role permissions updated successfully'));
    } catch (error) {
      console.error('Update role permissions error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

export { roleRoutes };
