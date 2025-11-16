import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission } from '../middleware/auth';
import { responses } from '../utils/responses';
import { getDI, getUser } from '../ioc/helpers';
import { JWTUtils } from '../utils/jwtUtils';
import { TOKENS } from '../ioc/tokens';
import type { UserService } from 'doggy-nav-core';
import type { D1UserRepository } from '../adapters/d1UserRepository';
import { PasswordUtils } from '../utils/passwordUtils';

const userRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// Public routes

// Protected routes requiring authentication
// Server-compat: GET /api/user/profile
userRoutes.get('/profile', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const current = getUser(c)!;
    const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
    const profile = await svc.getProfile(current.id);
    const extra = await c.env.DB.prepare(
      `SELECT nick_name, phone, is_active FROM users WHERE id = ? LIMIT 1`
    )
      .bind(current.id)
      .first<any>();
    return c.json(
      responses.ok(
        {
          id: profile.id,
          username: profile.username,
          email: profile.email,
          nickName: extra?.nick_name ?? current?.nickName ?? profile.username,
          phone: extra?.phone ?? '',
          avatar: profile.avatar ?? undefined,
          isActive: !!extra?.is_active,
          roles: profile.roles,
          groups: profile.groups,
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
    const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
    const updated = await svc.updateProfile(current.id, {
      email: body.email,
      avatar: body.avatar,
    });
    const extra = await c.env.DB.prepare(
      `SELECT nick_name, phone, is_active FROM users WHERE id = ? LIMIT 1`
    )
      .bind(current.id)
      .first<any>();
    return c.json(
      responses.ok(
        {
          id: updated.id,
          username: updated.username,
          email: updated.email,
          nickName: extra?.nick_name ?? current?.nickName ?? updated.username,
          phone: extra?.phone ?? '',
          avatar: updated.avatar ?? undefined,
          isActive: !!extra?.is_active,
        },
        'Profile updated successfully'
      )
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Server-compat: PUT /api/user/password
userRoutes.put('/password', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const current = getUser(c)!;
    const body = await c.req.json().catch(() => ({}));
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return c.json(responses.badRequest('Current password and new password are required'), 400);
    }

    const validation = PasswordUtils.validatePassword(newPassword);
    if (!validation.valid) {
      return c.json(
        responses.badRequest(`New password validation failed: ${validation.errors.join(', ')}`),
        400
      );
    }

    const di = getDI(c);
    const userRepository = di.resolve(TOKENS.UserRepo) as D1UserRepository;
    const dbUser = await userRepository.getById(current.id);
    if (!dbUser || !dbUser.passwordHash) {
      return c.json(responses.badRequest('User not found'), 404);
    }

    const isValidCurrent = await PasswordUtils.verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValidCurrent) {
      return c.json(responses.badRequest('Current password is incorrect'), 400);
    }

    const hashed = await PasswordUtils.hashPassword(newPassword);
    await userRepository.update(current.id, { passwordHash: hashed });

    return c.json(responses.ok({}, 'Password changed successfully'));
  } catch (error) {
    console.error('User password change error:', error);
    return c.json(responses.serverError(), 500);
  }
});
userRoutes.get(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('user:read'),
  async (c) => {
    try {
      // Server-compat params
      const pageSize = Math.min(
        Math.max(Number(c.req.query('pageSize') ?? c.req.query('page_size') ?? 10) || 10, 1),
        100
      );
      const pageNumber = Math.max(
        Number(c.req.query('pageNumber') ?? c.req.query('current') ?? 1) || 1,
        1
      );
      const account = c.req.query('account') || '';
      const email = c.req.query('email') || '';
      const statusRaw = c.req.query('status');
      const status =
        statusRaw !== undefined && statusRaw !== ''
          ? String(statusRaw) === '1' || String(statusRaw).toLowerCase() === 'true'
          : undefined;

      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const { list, total } = await svc.adminList(
        { account: account || undefined, email: email || undefined, status },
        { pageSize, pageNumber }
      );
      return c.json(responses.ok({ list, total }));
    } catch (error) {
      console.error('Get users error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

userRoutes.get('/:id', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const currentUser = getUser(c)!;
    const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
    const info = await svc.adminGetOne(id);
    if (!info) return c.json(responses.notFound('User not found'), 404);

    if (
      currentUser.id !== id &&
      !JWTUtils.hasPermission({ permissions: currentUser.permissions } as any, 'user:read')
    ) {
      return c.json(responses.err('Insufficient permissions'), 403);
    }

    return c.json(responses.ok(info));
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.post(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('user:create'),
  async (c) => {
    try {
      const body = await c.req.json();
      const {
        username,
        account,
        email,
        password,
        nickName,
        phone,
        status,
        isActive,
        roles,
        groups,
      } = body || {};
      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      try {
        const res = await svc.adminCreate({
          account: String(username || account || '').trim(),
          email,
          password,
          status: status !== undefined ? !!status : isActive !== undefined ? !!isActive : true,
          nickName,
          phone,
          roles,
          groups,
        });
        const info = await svc.adminGetOne(res.id);
        const payload = info ? { user: info } : { id: res.id };
        return c.json(responses.ok(payload, 'User created successfully'), 201);
      } catch (e: any) {
        if (e?.name === 'ValidationError') return c.json(responses.badRequest(e.message), 400);
        const msg = String(e?.message || '');
        if (/UNIQUE constraint failed/i.test(msg))
          return c.json(responses.badRequest('User already exists'), 409);
        throw e;
      }
    } catch (error) {
      console.error('Create user error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

userRoutes.put(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('user:update'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminUpdate(id, {
        email: body.email,
        nickName: body.nickName,
        phone: body.phone,
        status: body.isActive,
        password: body.password,
        roles: body.roles,
        groups: body.groups,
      });
      if (!ok) return c.json(responses.serverError('Failed to update user'), 500);
      const info = await svc.adminGetOne(id);
      if (!info) return c.json(responses.notFound('User not found'), 404);
      return c.json(responses.ok({ user: info }, 'User updated successfully'));
    } catch (error) {
      console.error('Update user error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Server-compat: PATCH /api/user/:id
userRoutes.patch(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('user:update'),
  async (c) => {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();
      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminUpdate(id, {
        email: body.email,
        nickName: body.nickName,
        phone: body.phone,
        status: typeof body.status !== 'undefined' ? !!body.status : undefined,
        password: body.password,
        roles: Array.isArray(body.roles) ? body.roles : undefined,
        groups: Array.isArray(body.groups) ? body.groups : undefined,
      });
      if (!ok) return c.json(responses.serverError('Failed to update user'), 500);
      return c.json(responses.ok(true));
    } catch (error) {
      console.error('Patch user error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

userRoutes.delete(
  '/:id',
  createAuthMiddleware({ required: true }),
  requirePermission('user:delete'),
  async (c) => {
    try {
      const { id } = c.req.param();
      // Don't allow deletion of self
      const currentUser = getUser(c)!;
      if (currentUser.id === id) {
        return c.json(responses.badRequest('Cannot delete your own account'), 400);
      }
      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminDelete([id]);
      if (!ok) return c.json(responses.serverError('Failed to delete user'), 500);
      return c.json(responses.ok({}, 'User deleted successfully'));
    } catch (error) {
      console.error('Delete user error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

// Server-compat: DELETE /api/user (ids list)
userRoutes.delete(
  '/',
  createAuthMiddleware({ required: true }),
  requirePermission('user:delete'),
  async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
      if (!ids.length) return c.json(responses.badRequest('ids required'), 400);
      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminDelete(ids);
      return c.json(
        ok ? responses.ok(true) : responses.serverError('Failed to delete some users'),
        ok ? 200 : 500
      );
    } catch (error) {
      return c.json(responses.serverError(), 500);
    }
  }
);

userRoutes.get('/:id/roles', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const di = getDI(c);
    const userRepository = di.resolve(TOKENS.UserRepo) as D1UserRepository;

    // Check if user exists
    const user = await userRepository.getById(id);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    const roles = await userRepository.getUserRoles(id);

    return c.json(
      responses.ok(
        {
          roles,
        },
        'User roles retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get user roles error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.get('/:id/groups', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const { id } = c.req.param();
    const di = getDI(c);
    const userRepository = di.resolve(TOKENS.UserRepo) as D1UserRepository;

    // Check if user exists
    const user = await userRepository.getById(id);
    if (!user) {
      return c.json(responses.notFound('User not found'), 404);
    }

    const groups = await userRepository.getUserGroups(id);

    return c.json(
      responses.ok(
        {
          groups,
        },
        'User groups retrieved successfully'
      )
    );
  } catch (error) {
    console.error('Get user groups error:', error);
    return c.json(responses.serverError(), 500);
  }
});

userRoutes.put(
  '/:userId/roles',
  createAuthMiddleware({ required: true }),
  requirePermission('user:update'),
  async (c) => {
    try {
      const { userId } = c.req.param();
      const body = await c.req.json();
      const { roleIds } = body;

      if (!Array.isArray(roleIds)) {
        return c.json(responses.badRequest('roleIds must be an array'), 400);
      }

      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminUpdate(userId, { roles: roleIds });
      if (!ok) return c.json(responses.serverError('Failed to update roles'), 500);

      return c.json(responses.ok({}, 'User roles updated successfully'));
    } catch (error) {
      console.error('Update user roles error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

userRoutes.put(
  '/:userId/groups',
  createAuthMiddleware({ required: true }),
  requirePermission('user:update'),
  async (c) => {
    try {
      const { userId } = c.req.param();
      const body = await c.req.json();
      const { groupIds } = body;

      if (!Array.isArray(groupIds)) {
        return c.json(responses.badRequest('groupIds must be an array'), 400);
      }

      const svc = getDI(c).resolve(TOKENS.UserService) as UserService;
      const ok = await svc.adminUpdate(userId, { groups: groupIds });
      if (!ok) return c.json(responses.serverError('Failed to update groups'), 500);

      return c.json(responses.ok({}, 'User groups updated successfully'));
    } catch (error) {
      console.error('Update user groups error:', error);
      return c.json(responses.serverError(), 500);
    }
  }
);

export { userRoutes };
