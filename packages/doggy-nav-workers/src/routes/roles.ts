import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission } from '../middleware/auth';
import { D1RoleRepository } from '../adapters/d1RoleRepository';
import { responses } from '../index';

const roleRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

roleRoutes.get('/', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const page = Math.max(Number(c.req.query('page') ?? 1), 1);
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 50), 1), 100);
    const search = c.req.query('search') || '';
    const isSystem = c.req.query('isSystem');

    const roleRepository = new D1RoleRepository(c.env.DB);

    const options: any = {
      pageSize: limit,
      pageNumber: page,
      filter: {
        ...(search && { search }),
        ...(isSystem !== undefined && { isSystem: isSystem === 'true' }),
      },
    };

    const result = await roleRepository.list(options);

    return c.json(responses.ok({
      roles: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.pageNumber,
      },
    }, 'Roles retrieved successfully'));

  } catch (error) {
    console.error('Get roles error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.get('/:id', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = new D1RoleRepository(c.env.DB);
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
    const roleRepository = new D1RoleRepository(c.env.DB);
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

    const roleRepository = new D1RoleRepository(c.env.DB);

    // Check if role already exists
    const existingRole = await roleRepository.getBySlug(slug);
    if (existingRole) {
      return c.json(responses.badRequest('Role with this slug already exists'), 409);
    }

    const newRole = await roleRepository.create({
      slug,
      displayName,
      description: description || '',
      permissions: permissions || [],
      isSystem: isSystem || false,
    });

    return c.json(responses.ok({
      role: newRole,
    }, 'Role created successfully'), 201);

  } catch (error) {
    console.error('Create role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.put('/:id', createAuthMiddleware({ required: true }), requirePermission('role:update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const roleRepository = new D1RoleRepository(c.env.DB);

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
    if (body.permissions !== undefined) updates.permissions = body.permissions;
    if (body.isSystem !== undefined && !existingRole.isSystem) updates.isSystem = body.isSystem;

    const updatedRole = await roleRepository.update(id, updates);

    return c.json(responses.ok({
      role: updatedRole,
    }, 'Role updated successfully'));

  } catch (error) {
    console.error('Update role error:', error);
    return c.json(responses.serverError(), 500);
  }
});

roleRoutes.delete('/:id', createAuthMiddleware({ required: true }), requirePermission('role:delete'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = new D1RoleRepository(c.env.DB);

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

roleRoutes.get('/:id/permissions', createAuthMiddleware({ required: true }), requirePermission('role:read'), async (c) => {
  try {
    const { id } = c.req.param();
    const roleRepository = new D1RoleRepository(c.env.DB);

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

    const roleRepository = new D1RoleRepository(c.env.DB);

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