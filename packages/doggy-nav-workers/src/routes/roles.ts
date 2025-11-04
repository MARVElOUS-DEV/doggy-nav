import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission } from '../middleware/auth';
import { TOKENS } from '../ioc/tokens';
import { getDI } from '../ioc/helpers';
import { responses } from '../utils/responses';

const roleRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

roleRoutes.get('/', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? c.req.query('limit') ?? 50) || 50, 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? c.req.query('page') ?? 1) || 1, 1);
    const isSystem = c.req.query('isSystem');

    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    const options: any = {
      pageSize,
      pageNumber,
      filter: {
        ...(isSystem !== undefined && { isSystem: isSystem === 'true' }),
      },
    };

    const result = await roleRepository.list(options);

    // Server parity: { data, total, pageNumber }
    return c.json(responses.ok({ data: result.data, total: result.total, pageNumber: result.pageNumber }));

  } catch (error) {
    console.error('Get roles error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.get('/:id', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;
    const role = await roleRepository.getById(id);

    if (!role) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    return c.json(responses.ok({
      role,
    }, 'Role retrieved successfully'));

  } catch (error) {
    console.error('Get role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.get('/slug/:slug', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const { slug } = c.req.param();
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;
    const role = await roleRepository.getBySlug(slug);

    if (!role) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    return c.json(responses.ok({
      role,
    }, 'Role retrieved successfully'));

  } catch (error) {
    console.error('Get role by slug error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.post('/', createAuthMiddleware({ required: true }), requirePermission('role:create'), async (c) => {
  try {
    const body = await c.req.json();
    const { slug, displayName, description, permissions, isSystem } = body;

    if (!slug || !displayName) {
      return c.json(responses.badRequest('Slug and display name are required'), 400);
    }

    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    // Check if role already exists
    const existingRole = await roleRepository.getBySlug(slug);
    if (existingRole) {
      return c.json(responses.badRequest('Role with this slug already exists'), 409);
    }

    const perms = Array.isArray(permissions)
      ? permissions
      : typeof permissions === 'string'
        ? permissions
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

    const newRole = await roleRepository.create({
      slug,
      displayName,
      description: description || '',
      permissions: perms,
      isSystem: isSystem || false,
    });

    return c.json(responses.ok(newRole), 201);

  } catch (error) {
    console.error('Create role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.put('/:id', createAuthMiddleware({ required: true }), requirePermission('role:update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    // Check if role exists
    const existingRole = await roleRepository.getById(id);
    if (!existingRole) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    // Don't allow modification of system roles
    if (existingRole.isSystem && body.isSystem === false) {
      return c.json(responses.badRequest('Cannot modify system role properties'), 400);
    }

    // Update role
    const updates: any = {};
    if (body.displayName !== undefined) updates.displayName = body.displayName;
    if (body.description !== undefined) updates.description = body.description;
    if (body.permissions !== undefined) {
      updates.permissions = Array.isArray(body.permissions)
        ? body.permissions
        : typeof body.permissions === 'string'
          ? body.permissions
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];
    }
    if (body.isSystem !== undefined && !existingRole.isSystem) updates.isSystem = body.isSystem;

    const updatedRole = await roleRepository.update(id, updates);

    return c.json(responses.ok(updatedRole));

  } catch (error) {
    console.error('Update role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: PUT /api/roles (body.id)
roleRoutes.put('/', createAuthMiddleware({ required: true }), requirePermission('role:update'), async (c) => {
  try {
    const body = await c.req.json();
    const { id, displayName, description, permissions, isSystem } = body || {};
    if (!id) return c.json(responses.badRequest('id required'), 400);
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;
    const existingRole = await roleRepository.getById(id);
    if (!existingRole) return c.json(responses.notFound('Role not found'), 404);
    const perms = Array.isArray(permissions)
      ? permissions
      : typeof permissions === 'string'
        ? permissions
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : undefined;
    const updatedRole = await roleRepository.update(id, { displayName, description, permissions: perms, isSystem });
    return c.json(responses.ok(updatedRole));
  } catch (error) {
    console.error('Update role (compat) error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.delete('/:id', createAuthMiddleware({ required: true }), requirePermission('role:delete'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    // Check if role exists
    const existingRole = await roleRepository.getById(id);
    if (!existingRole) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    // Don't allow deletion of system roles
    if (existingRole.isSystem) {
      return c.json(responses.badRequest('Cannot delete system role'), 400);
    }

    const deleted = await roleRepository.delete(id);
    if (!deleted) {
      return c.json(responses.serverError('Failed to delete role'), 500);
    }

    return c.json(responses.ok({}, 'Role deleted successfully'));

  } catch (error) {
    console.error('Delete role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: DELETE /api/roles (body.id)
roleRoutes.delete('/', createAuthMiddleware({ required: true }), requirePermission('role:delete'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const id = body?.id;
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    if (ids.length > 0) {
      let ok = true;
      for (const rid of ids) {
        const existing = await roleRepository.getById(rid);
        if (!existing) { ok = false; continue; }
        if (existing.isSystem) { ok = false; continue; }
        const deleted = await roleRepository.delete(rid);
        ok = ok && deleted;
      }
      return c.json(ok ? responses.ok({}) : responses.serverError('Failed to delete some roles'), ok ? 200 : 500);
    }

    if (!id) return c.json(responses.badRequest('id or ids required'), 400);
    const existingRole = await roleRepository.getById(id);
    if (!existingRole) return c.json(responses.notFound('Role not found'), 404);
    if (existingRole.isSystem) return c.json(responses.badRequest('Cannot delete system role'), 400);
    const deleted = await roleRepository.delete(id);
    return c.json(deleted ? responses.ok({}) : responses.serverError('Failed to delete role'), deleted ? 200 : 500);
  } catch (error) {
    console.error('Delete role (compat) error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.get('/:id/permissions', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    // Check if role exists
    const role = await roleRepository.getById(id);
    if (!role) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    const permissions = await roleRepository.getRolePermissions(id);

    return c.json(responses.ok({
      permissions,
    }, 'Role permissions retrieved successfully'));

  } catch (error) {
    console.error('Get role permissions error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.put('/:id/permissions', createAuthMiddleware({ required: true }), requirePermission('role:update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return c.json(responses.badRequest('permissions must be an array'), 400);
    }

    const roleRepository = getDI(c).resolve(TOKENS.RoleRepo) as any;

    // Check if role exists
    const role = await roleRepository.getById(id);
    if (!role) {
      return c.json(responses.notFound('Role not found'), 404);
    }

    await roleRepository.setRolePermissions(id, permissions);

    return c.json(responses.ok({}, 'Role permissions updated successfully'));

  } catch (error) {
    console.error('Update role permissions error:', error);
    return c.json(responses.serverError(), 500);
  }
});

export { roleRoutes };