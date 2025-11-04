import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission, requireRole } from '../middleware/auth';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../utils/responses';
import { getUser } from '../ioc/helpers';
import { JWTUtils } from '../utils/jwtUtils';
import { PasswordUtils } from '../utils/passwordUtils';

const userRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// Public routes

// Protected routes requiring authentication
// Server-compat: GET /api/user/profile
userRoutes.get('/profile', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const current = getUser(c)!;
    const repo = new D1UserRepository(c.env.DB);
    const user = await repo.getById(current.id);
    if (!user) return c.json(responses.notFound('User not found'), 404);
    return c.json(
      responses.ok(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          nickName: user.nickName,
          phone: user.phone,
          avatar: user.avatar,
          isActive: user.isActive,
          roles: await repo.getUserRoles(user.id),
          groups: await repo.getUserGroups(user.id),
        },
        'User profile retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Profile error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: PUT /api/user/profile
userRoutes.put('/profile', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const current = getUser(c)!;
    const body = await c.req.json().catch(() => ({}));
    const repo = new D1UserRepository(c.env.DB);
    const updates: any = {};
    if (body.email !== undefined) updates.email = body.email;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    // Server focuses on email/avatar; keep others unchanged for parity
    const updated = await repo.update(current.id, updates);
    if (!updated) return c.json(responses.notFound('User not found'), 404);
    return c.json(
      responses.ok(
        {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          nickName: updated.nickName,
          phone: updated.phone,
          avatar: updated.avatar,
        },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json(responses.serverError(), 500);
  }
});
userRoutes.get('/', createAuthMiddleware({ required: true }), requirePermission('user:read'), async (c) => {
  try {
    // Server-compat params
    const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? c.req.query('page_size') ?? 10) || 10, 1), 100);
    const pageNumber = Math.max(Number(c.req.query('pageNumber') ?? c.req.query('current') ?? 1) || 1, 1);
    const account = c.req.query('account') || '';
    const email = c.req.query('email') || '';
    const statusRaw = c.req.query('status');
    const status = statusRaw !== undefined && statusRaw !== '' ? (String(statusRaw) === '1' || String(statusRaw).toLowerCase() === 'true') : undefined;

    const userRepository = new D1UserRepository(c.env.DB);

    // Build simple filters (exact email / username contains)
    const list = await userRepository.list({
      pageSize,
      pageNumber,
      filter: {
        emails: email ? [String(email)] : undefined,
        usernames: account ? [String(account)] : undefined,
        isActive: status,
      },
    });

    // Map to AdminUserListItem[]
    const data = await Promise.all(list.data.map(async (u) => {
      const roles = await userRepository.getUserRoles(u.id);
      const role = roles.includes('admin') || roles.includes('sysadmin') ? 'admin' : 'default';
      // groups display names (fallback to slug)
      const groupRows = await c.env.DB.prepare(`SELECT g.display_name, g.slug FROM groups g JOIN user_groups ug ON ug.group_id = g.id WHERE ug.user_id = ?`).bind(u.id).all<any>();
      const groups = (groupRows.results || []).map((g: any) => g.display_name || g.slug).filter(Boolean);
      return {
        id: u.id,
        account: u.username,
        nickName: u.nickName || u.username,
        avatar: u.avatar || '',
        email: u.email,
        role,
        groups,
        status: u.isActive ? 1 : 0,
        createdAt: u.createdAt?.toISOString?.() || undefined,
        updatedAt: u.updatedAt?.toISOString?.() || undefined,
      };
    }));

    return c.json(responses.ok({ list: data, total: list.total }));

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
    const currentUser = getUser(c)!;
    if (currentUser.id !== id && !JWTUtils.hasPermission({ permissions: currentUser.permissions } as any, 'user:read')) {
      return c.json(responses.err('Insufficient permissions'), 403);
    }

    const rolesIdsRs = await c.env.DB.prepare(`SELECT role_id FROM user_roles WHERE user_id = ?`).bind(id).all<any>();
    const roles = (rolesIdsRs.results || []).map((r: any) => String(r.role_id));
    const groupsIdsRs = await c.env.DB.prepare(`SELECT group_id FROM user_groups WHERE user_id = ?`).bind(id).all<any>();
    const groups = (groupsIdsRs.results || []).map((g: any) => String(g.group_id));

    return c.json(responses.ok({
      id: user.id,
      account: user.username,
      nickName: user.nickName || user.username,
      email: user.email,
      phone: user.phone || '',
      status: !!user.isActive,
      role: (await userRepository.getUserRoles(user.id)).some((r) => r === 'admin' || r === 'sysadmin') ? 'admin' : 'default',
      roles,
      groups,
    }));

  } catch (error) {
    console.error('Get user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.post('/', createAuthMiddleware({ required: true }), requirePermission('user:create'), async (c) => {
  try {
    const body = await c.req.json();
    const { username, account, email, password, nickName, phone, status, isActive, roles, groups } = body;

    const finalUsername = String(username || account || '').trim();
    if (!finalUsername || !email || !password) {
      return c.json(responses.badRequest('Username/account, email, and password are required'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);

    // Check if user already exists
    const existingUser = await userRepository.getByEmail(email);
    if (existingUser) {
      return c.json(responses.badRequest('User with this email already exists'), 409);
    }

    const existingUsername = await userRepository.getByUsername(finalUsername);
    if (existingUsername) {
      return c.json(responses.badRequest('Username already taken'), 409);
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(password);

    const newUser = await userRepository.create({
      username: finalUsername,
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

    // Status mapping
    const effActive = status !== undefined ? !!status : isActive !== undefined ? !!isActive : undefined;
    if (effActive !== undefined) {
      await userRepository.update(newUser.id, { isActive: effActive });
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

// Server-compat: PATCH /api/user/:id
userRoutes.patch('/:id', createAuthMiddleware({ required: true }), requirePermission('user:update'), async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const userRepository = new D1UserRepository(c.env.DB);
    const exists = await userRepository.getById(id);
    if (!exists) return c.json(responses.notFound('User not found'), 404);
    // Map server adminUpdate input to fields
    await userRepository.update(id, {
      email: body.email,
      nickName: body.nickName,
      phone: body.phone,
      isActive: typeof body.status !== 'undefined' ? !!body.status : undefined,
      avatar: body.avatar,
    });
    if (Array.isArray(body.roles)) {
      await userRepository.setUserRoles(id, body.roles);
    }
    if (Array.isArray(body.groups)) {
      await userRepository.setUserGroups(id, body.groups);
    }
    return c.json(responses.ok(true));
  } catch (error) {
    console.error('Patch user error:', error);
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
    const currentUser = getUser(c)!;
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

// Server-compat: DELETE /api/user (ids list)
userRoutes.delete('/', createAuthMiddleware({ required: true }), requirePermission('user:delete'), async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    const repo = new D1UserRepository(c.env.DB);
    if (!ids.length) return c.json(responses.badRequest('ids required'), 400);
    let ok = true;
    for (const id of ids) {
      const del = await repo.delete(id);
      ok = ok && del;
    }
    return c.json(ok ? responses.ok(true) : responses.serverError('Failed to delete some users'), ok ? 200 : 500);
  } catch (error) {
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