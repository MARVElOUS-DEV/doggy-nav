import { Hono } from 'hono';
import { JWTUtils } from '../utils/jwtUtils';
import { getAccessTokenFromCookies } from '../utils/cookieAuth';
import { D1UserRepository } from '../adapters/d1UserRepository';
import { responses } from '../utils/responses';
import { getUserAccessContext } from '../utils/userContext';

interface AuthContext {
  user?: {
    id: string;
    email: string;
    username: string;
    roles: string[];
    groups: string[];
    permissions: string[];
  };
}

// Global cache for JWT utilities
let jwtUtils: JWTUtils | null = null;

function getJWTUtils(env: { JWT_SECRET?: string }): JWTUtils {
  if (!jwtUtils && env.JWT_SECRET) {
    jwtUtils = new JWTUtils(env.JWT_SECRET);
  }
  return jwtUtils!;
}

/**
 * Authentication middleware factory
 */
export function createAuthMiddleware(options: { required?: boolean } = {}) {
  return async (c: any, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization');
    let token = JWTUtils.extractTokenFromHeader(authHeader);
    if (!token) {
      const cookieToken = getAccessTokenFromCookies(c);
      if (cookieToken) token = cookieToken.startsWith('Bearer ') ? cookieToken.slice(7) : cookieToken;
    }

    if (!token) {
      if (options.required) {
        return c.json(responses.err('Authentication required'), 401);
      }
      return await next();
    }

    try {
      const jwtUtils = getJWTUtils(c.env);
      const payload = await jwtUtils.verifyAccessToken(token);

      if (!payload) {
        return c.json(responses.err('Invalid token'), 401);
      }

      // Check if token is expired
      if (JWTUtils.isTokenExpired(payload)) {
        return c.json(responses.err('Token expired'), 401);
      }

      // Load user access context centrally
      const userRepository = new D1UserRepository(c.env.DB);
      const ctx = await getUserAccessContext(c.env.DB, userRepository, payload.userId);
      if (!ctx) return c.json(responses.err('User not found or inactive'), 401);
      c.set('user', {
        id: ctx.user.id,
        email: ctx.user.email,
        username: ctx.user.username,
        roles: ctx.roles,
        groups: ctx.groups,
        permissions: ctx.permissions,
      });

      await next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json(responses.err('Authentication failed'), 401);
    }
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(permission: string) {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user') as AuthContext['user'];

    if (!user) {
      return c.json(responses.err('Authentication required'), 401);
    }

    if (!JWTUtils.hasPermission({ permissions: user.permissions } as any, permission)) {
      return c.json(responses.err('Insufficient permissions'), 403);
    }

    await next();
  };
}

/**
 * Role-based authorization middleware
 */
export function requireRole(role: string) {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user') as AuthContext['user'];

    if (!user) {
      return c.json(responses.err('Authentication required'), 401);
    }

    if (!JWTUtils.hasRole({ roles: user.roles } as any, role)) {
      return c.json(responses.err('Insufficient role'), 403);
    }

    await next();
  };
}

/**
 * Group-based authorization middleware
 */
export function requireGroup(group: string) {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user') as AuthContext['user'];

    if (!user) {
      return c.json(responses.err('Authentication required'), 401);
    }

    if (!JWTUtils.isInGroup({ groups: user.groups } as any, group)) {
      return c.json(responses.err('Insufficient group access'), 403);
    }

    await next();
  };
}

/**
 * Middleware to refresh user context (useful for routes that need fresh data)
 */
export function refreshUserContext() {
  return async (c: any, next: () => Promise<void>) => {
    const user = c.get('user') as AuthContext['user'];

    if (user) {
      const userRepository = new D1UserRepository(c.env.DB);
      const freshUser = await userRepository.getById(user.id);

      if (freshUser) {
        c.set('user', {
          ...user,
          roles: await userRepository.getUserRoles(user.id),
          groups: await userRepository.getUserGroups(user.id),
        });
      }
    }

    await next();
  };
}

/**
 * Public route middleware (no authentication required)
 */
export function publicRoute() {
  return async (c: any, next: () => Promise<void>) => {
    // Public routes can still have optional authentication
    const authHeader = c.req.header('Authorization');
    let token = JWTUtils.extractTokenFromHeader(authHeader);
    if (!token) {
      const cookieToken = getAccessTokenFromCookies(c);
      if (cookieToken) token = cookieToken.startsWith('Bearer ') ? cookieToken.slice(7) : cookieToken;
    }

    if (token) {
      try {
        const jwtUtils = getJWTUtils(c.env);
        const payload = await jwtUtils.verifyAccessToken(token);

        if (payload && !JWTUtils.isTokenExpired(payload)) {
          const userRepository = new D1UserRepository(c.env.DB);
          const user = await userRepository.getById(payload.userId);

          if (user && user.isActive) {
            c.set('user', {
              id: user.id,
              email: user.email,
              username: user.username,
              roles: payload.roles,
              groups: payload.groups,
              permissions: payload.permissions,
            });
          }
        }
      } catch (error) {
        // Ignore errors for public routes
        console.log('Public route auth error (ignored):', error);
      }
    }

    await next();
  };
}