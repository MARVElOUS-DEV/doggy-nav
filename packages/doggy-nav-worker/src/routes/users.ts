import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission, requireRole } from '../middleware/auth';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../index';
import { JWTUtils } from '../utils/jwtUtils';

const userRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// Public routes

// Protected routes requiring authentication
userRoutes.get('/', createAuthMiddleware({ required: true }), requirePermission('user:read'), async (c) => {
  try {
    const page = Math.max(Number(c.req.query('page') ?? 1), 1);
    const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 50), 1), 100);
    const search = c.req.query('search') || '';
    const isActive = c.req.query('isActive');

    const userRepository = new D1UserRepository(c.env.DB);

    const options: any = {
      pageSize: limit,
      pageNumber: page,
      filter: {
        ...(search && { search }),
        ...(isActive !== undefined && { isActive: isActive === 'true' }),
      },
    };

    const result = await userRepository.list(options);

    return c.json(responses.ok({
      users: result.data,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.pageNumber,
      },
    }, 'Users retrieved successfully'));

  } catch (error) {
    console.error('Get users error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.get('/:id', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const userRepository = new D1UserRepository(c.env.DB);
    const user = await userRepository.getById(id);

    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    // Only allow users to view their own profile or require permission
    const currentUser = c.get('user');
    if (currentUser.id !== id && !JWTUtils.hasPermission({ permissions: currentUser.permissions } as any, 'user:read')) {
      return c.json(responses.err('Insufficient permissions'), 403);
    }

    return c.json(responses.ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickName: user.nickName,
        phone: user.phone,
        isActive: user.isActive,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }, 'User retrieved successfully'));

  } catch (error) {
    console.error('Get user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.post('/', createAuthMiddleware({ required: true }), requirePermission('user:create'), async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password, nickName, phone, isActive, roles, groups } = body;

    if (!username || !email || !password) {
      return c.json(responses.badRequest('Username, email, and password are required'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user already exists
    const existingUser = await userRepository.getByEmail(email);
    if (existingUser) {
      return c.json(responses.badRequest('User with this email already exists'), 409);
    }

    const existingUsername = await userRepository.getByUsername(username);
    if (existingUsername) {
      return c.json(responses.badRequest('Username already taken'), 409);
    }

    // Hash password (this would be done in a real implementation)
    const passwordHash = 'hashed_password_placeholder'; // TODO: Implement password hashing

    const newUser = await userRepository.create({
      username,
      email,
      passwordHash,
      nickName: nickName || '',
      phone: phone || '',
    });

    // Set roles and groups if provided
    if (roles && Array.isArray(roles)) {
      await userRepository.setUserRoles(newUser.id, roles);
    }
    if (groups && Array.isArray(groups)) {
      await userRepository.setUserGroups(newUser.id, groups);
    }

    return c.json(responses.ok({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        nickName: newUser.nickName,
        phone: newUser.phone,
        isActive: newUser.isActive,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
      },
    }, 'User created successfully'), 201);

  } catch (error) {
    console.error('Create user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.put('/:id', createAuthMiddleware({ required: true }), requirePermission('user:update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const existingUser = await userRepository.getById(id);
    if (!existingUser) {
      return c.json(responses.notFound('User not found'), 404);
    }

    // Update user
    const updates: any = {};
    if (body.email !== undefined) updates.email = body.email;
    if (body.nickName !== undefined) updates.nickName = body.nickName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.avatar !== undefined) updates.avatar = body.avatar;

    const updatedUser = await userRepository.update(id, updates);

    // Update roles and groups if provided
    if (body.roles !== undefined) {
      await userRepository.setUserRoles(id, body.roles);
    }
    if (body.groups !== undefined) {
      await userRepository.setUserGroups(id, body.groups);
    }

    return c.json(responses.ok({
      user: {
        id: updatedUser!.id,
        username: updatedUser!.username,
        email: updatedUser!.email,
        nickName: updatedUser!.nickName,
        phone: updatedUser!.phone,
        isActive: updatedUser!.isActive,
        avatar: updatedUser!.avatar,
        updatedAt: updatedUser!.updatedAt,
      },
    }, 'User updated successfully'));

  } catch (error) {
    console.error('Update user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.delete('/:id', createAuthMiddleware({ required: true }), requirePermission('user:delete'), async (c) => {
  try {
    const { id } = c.req.param();
    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const existingUser = await userRepository.getById(id);
    if (!existingUser) {
      return c.json(responses.notFound('User not found'), 404);
    }

    // Don't allow deletion of self
    const currentUser = c.get('user');
    if (currentUser.id === id) {
      return c.json(responses.badRequest('Cannot delete your own account'), 400);
    }

    const deleted = await userRepository.delete(id);
    if (!deleted) {
      return c.json(responses.serverError('Failed to delete user'), 500);
    }

    return c.json(responses.ok({}, 'User deleted successfully'));

  } catch (error) {
    console.error('Delete user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.get('/:id/roles', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const user = await userRepository.getById(id);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    const roles = await userRepository.getUserRoles(id);

    return c.json(responses.ok({
      roles,
    }, 'User roles retrieved successfully'));

  } catch (error) {
    console.error('Get user roles error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.get('/:id/groups', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const user = await userRepository.getById(id);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    const groups = await userRepository.getUserGroups(id);

    return c.json(responses.ok({
      groups,
    }, 'User groups retrieved successfully'));

  } catch (error) {
    console.error('Get user groups error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.put('/:userId/roles', createAuthMiddleware({ required: true }), requirePermission('user:update'), async (c) => {
  try {
    const { userId } = c.req.param();
    const body = await c.req.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return c.json(responses.badRequest('roleIds must be an array'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    await userRepository.setUserRoles(userId, roleIds);

    return c.json(responses.ok({}, 'User roles updated successfully'));

  } catch (error) {
    console.error('Update user roles error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.put('/:userId/groups', createAuthMiddleware({ required: true }), requirePermission('user:update'), async (c) => {
  try {
    const { userId } = c.req.param();
    const body = await c.req.json();
    const { groupIds } = body;

    if (!Array.isArray(groupIds)) {
      return c.json(responses.badRequest('groupIds must be an array'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    await userRepository.setUserGroups(userId, groupIds);

    return c.json(responses.ok({}, 'User groups updated successfully'));

  } catch (error) {
    console.error('Update user groups error:', error);
    return c.json(responses.serverError(), 500);
  }
});

export { userRoutes };