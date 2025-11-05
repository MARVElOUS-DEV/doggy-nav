import { Hono } from 'hono';
import { createAuthMiddleware } from '../middleware/auth';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../utils/responses';
import { getUser } from '../ioc/helpers';

export const compatRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// GET /api/user/profile (compat)
compatRoutes.get('/user/profile', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    return c.json(responses.ok({ user }, 'User profile retrieved successfully'));
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

// PUT /api/user/profile (compat)
compatRoutes.put('/user/profile', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const current = getUser(c)!;
    const body = await c.req.json();
    const repo = new D1UserRepository(c.env.DB);
    const updates: any = {};
    if (body.nickName !== undefined) updates.nickName = body.nickName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    const updated = await repo.update(current.id, updates);
    if (!updated) return c.json(responses.notFound('User not found'), 404);
    return c.json(
      responses.ok(
        {
          user: {
            id: updated.id,
            username: updated.username,
            email: updated.email,
            nickName: updated.nickName,
            phone: updated.phone,
            avatar: updated.avatar,
          },
        },
        'Profile updated successfully'
      )
    );
  } catch (err) {
    return c.json(responses.serverError(), 500);
  }
});

export default compatRoutes;
