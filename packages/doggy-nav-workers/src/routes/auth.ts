import { Hono } from 'hono';
import { createAuthMiddleware, requirePermission } from '../middleware/auth';
import { JWTUtils } from '../utils/jwtUtils';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../index';
import { getUser } from '../ioc/helpers';
import bcrypt from 'bcryptjs';

const authRoutes = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET?: string } }>();

// Password utility functions
const PasswordUtils = {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },

  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// Public routes (no authentication required)
authRoutes.post('/register', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.serverError('Server misconfigured: missing JWT secret'), 500);
    }
    const body = await c.req.json();
    const { username, email, password, nickName } = body;

    // Validate required fields
    if (!username || !email || !password) {
      return c.json(responses.badRequest('Username, email, and password are required'), 400);
    }

    // Validate password strength
    const passwordValidation = PasswordUtils.validatePassword(password);
    if (!passwordValidation.valid) {
      return c.json(responses.badRequest(`Password validation failed: ${passwordValidation.errors.join(', ')}`), 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json(responses.badRequest('Invalid email format'), 400);
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

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(password);

    // Create user
    const newUser = await userRepository.create({
      username,
      email,
      passwordHash,
      nickName: nickName || '',
    });

    // Generate JWT tokens
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);
    const userPayload = JWTUtils.createPayload({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      roles: await userRepository.getUserRoles(newUser.id),
      groups: await userRepository.getUserGroups(newUser.id),
      permissions: newUser.extraPermissions,
    });

    const tokens = await jwtUtils.generateTokenPair(userPayload);

    return c.json(responses.ok({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        nickName: newUser.nickName,
        roles: userPayload.roles,
        groups: userPayload.groups,
        permissions: userPayload.permissions,
      },
      tokens,
    }, 'User registered successfully'));

  } catch (error) {
    console.error('Registration error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/login', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.serverError('Server misconfigured: missing JWT secret'), 500);
    }
    const body = await c.req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return c.json(responses.badRequest('Email and password are required'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);
    const user = await userRepository.getByEmail(email);

    if (!user) {
      return c.json(responses.badRequest('Invalid credentials'), 401);
    }

    if (!user.isActive) {
      return c.json(responses.badRequest('Account is deactivated'), 401);
    }

    const isValidPassword = await PasswordUtils.verifyPassword(password, user.passwordHash!);
    if (!isValidPassword) {
      return c.json(responses.badRequest('Invalid credentials'), 401);
    }

    // Update last login
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    // Generate JWT tokens
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);
    const userPayload = JWTUtils.createPayload({
      id: user.id,
      email: user.email,
      username: user.username,
      roles: await userRepository.getUserRoles(user.id),
      groups: await userRepository.getUserGroups(user.id),
      permissions: user.extraPermissions,
    });

    const tokens = await jwtUtils.generateTokenPair(userPayload);

    return c.json(responses.ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickName: user.nickName,
        roles: userPayload.roles,
        groups: userPayload.groups,
        permissions: userPayload.permissions,
        avatar: user.avatar,
      },
      tokens,
    }, 'Login successful'));

  } catch (error) {
    console.error('Login error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/refresh', async (c) => {
  try {
    if (!c.env.JWT_SECRET) {
      return c.json(responses.serverError('Server misconfigured: missing JWT secret'), 500);
    }
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json(responses.badRequest('Refresh token is required'), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);
    const jwtUtils = new JWTUtils(c.env.JWT_SECRET!);

    // Verify refresh token
    const refreshPayload = await jwtUtils.verifyRefreshToken(refreshToken);
    if (!refreshPayload) {
      return c.json(responses.badRequest('Invalid refresh token'), 401);
    }

    // Get user data
    const user = await userRepository.getById(refreshPayload.userId);
    if (!user || !user.isActive) {
      return c.json(responses.badRequest('User not found or inactive'), 401);
    }

    // Generate new access token
    const userPayload = JWTUtils.createPayload({
      id: user.id,
      email: user.email,
      username: user.username,
      roles: await userRepository.getUserRoles(user.id),
      groups: await userRepository.getUserGroups(user.id),
      permissions: user.extraPermissions,
    });

    const newTokens = await jwtUtils.refreshAccessToken(refreshToken, userPayload);

    if (!newTokens) {
      return c.json(responses.badRequest('Failed to refresh token'), 401);
    }

    return c.json(responses.ok({
      tokens: newTokens,
    }, 'Token refreshed successfully'));

  } catch (error) {
    console.error('Refresh error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/logout', async (c) => {
  try {
    // In JWT-based auth, logout is typically handled client-side
    // We could implement a token blacklist here if needed
    return c.json(responses.ok({}, 'Logout successful'));
  } catch (error) {
    console.error('Logout error:', error);
    return c.json(responses.serverError(), 500);
  }
});

// Protected routes (require authentication)
authRoutes.get('/me', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;

    return c.json(responses.ok({
      user,
    }, 'User profile retrieved successfully'));

  } catch (error) {
    console.error('Profile error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.put('/me', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const body = await c.req.json();

    const userRepository = new D1UserRepository(c.env.DB);

    // Update user profile
    const updates: any = {};
    if (body.nickName !== undefined) updates.nickName = body.nickName;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.avatar !== undefined) updates.avatar = body.avatar;

    const updatedUser = await userRepository.update(user.id, updates);

    if (!updatedUser) {
      return c.json(responses.badRequest('User not found'), 404);
    }

    return c.json(responses.ok({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        nickName: updatedUser.nickName,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
      },
    }, 'Profile updated successfully'));

  } catch (error) {
    console.error('Profile update error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/change-password', createAuthMiddleware({ required: true }), async (c) => {
  try {
    const user = getUser(c)!;
    const body = await c.req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return c.json(responses.badRequest('Current password and new password are required'), 400);
    }

    const passwordValidation = PasswordUtils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return c.json(responses.badRequest(`New password validation failed: ${passwordValidation.errors.join(', ')}`), 400);
    }

    const userRepository = new D1UserRepository(c.env.DB);
    const currentUser = await userRepository.getById(user.id);

    if (!currentUser) {
      return c.json(responses.badRequest('User not found'), 404);
    }

    const isValidCurrentPassword = await PasswordUtils.verifyPassword(currentPassword, currentUser.passwordHash!);
    if (!isValidCurrentPassword) {
      return c.json(responses.badRequest('Current password is incorrect'), 400);
    }

    const newPasswordHash = await PasswordUtils.hashPassword(newPassword);
    await userRepository.update(user.id, { passwordHash: newPasswordHash });

    return c.json(responses.ok({}, 'Password changed successfully'));

  } catch (error) {
    console.error('Change password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json(responses.badRequest('Email is required'), 400);
    }

    // In a real implementation, you would:
    // 1. Generate a password reset token
    // 2. Store it in the database with expiry
    // 3. Send an email with reset link
    // For now, we'll just return a success message

    return c.json(responses.ok({}, 'If an account with that email exists, a password reset link has been sent'));

  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

authRoutes.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return c.json(responses.badRequest('Reset token and new password are required'), 400);
    }

    const passwordValidation = PasswordUtils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return c.json(responses.badRequest(`Password validation failed: ${passwordValidation.errors.join(', ')}`), 400);
    }

    // In a real implementation, you would:
    // 1. Verify the reset token
    // 2. Check if it's expired
    // 3. Update the user's password
    // For now, we'll just return a success message

    return c.json(responses.ok({}, 'Password reset successful'));

  } catch (error) {
    console.error('Reset password error:', error);
    return c.json(responses.serverError(), 500);
  }
});

export { authRoutes, PasswordUtils };