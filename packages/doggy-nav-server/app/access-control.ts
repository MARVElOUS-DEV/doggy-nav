import type { AuthUserContext } from '../types/rbac';
export type AccessLevel = 'public' | 'authenticated' | 'optional';

// Optional, more granular requirement (RBAC extension)
export interface AccessRequirement {
  level?: AccessLevel;
  anyRole?: string[]; // role slugs
  anyGroup?: string[]; // group slugs
  anyPermission?: string[]; // permission codes
  allPermissions?: string[]; // must include all
}

export interface RoutePermission {
  method: string;
  path: string;
  require?: AccessRequirement;
  description?: string;
}

// Route access control matrix
export const routePermissions: RoutePermission[] = [
  // User authentication routes
  { method: 'POST', path: '/api/register', require: { level: 'public' }, description: 'User registration' },
  { method: 'POST', path: '/api/login', require: { level: 'public' }, description: 'User login' },
  { method: 'GET', path: '/api/auth/me', require: { level: 'optional' }, description: 'Get current authenticated user' },
  { method: 'POST', path: '/api/auth/logout', require: { level: 'public' }, description: 'Logout (clear auth cookies)' },
  { method: 'GET', path: '/api/auth/config', require: { level: 'public' }, description: 'Get auth-related configuration' },
  { method: 'GET', path: '/api/auth/providers', require: { level: 'public' }, description: 'List enabled OAuth providers' },
  { method: 'GET', path: '/api/auth/:provider', require: { level: 'public' }, description: 'Start OAuth with provider' },
  { method: 'GET', path: '/api/auth/:provider/callback', require: { level: 'public' }, description: 'OAuth callback for provider' },
  { method: 'GET', path: '/api/user/profile', require: { level: 'authenticated' }, description: 'Get user profile' },
  { method: 'PUT', path: '/api/user/profile', require: { level: 'authenticated' }, description: 'Update user profile' },
  // User management
  { method: 'GET', path: '/api/user', require: { anyRole: ['superadmin'] }, description: 'List users' },
  { method: 'GET', path: '/api/user/:id', require: { anyRole: ['superadmin'] }, description: 'Get user detail' },
  { method: 'POST', path: '/api/user', require: { anyRole: ['superadmin'] }, description: 'Create user' },
  { method: 'PATCH', path: '/api/user/:id', require: { anyRole: ['superadmin'] }, description: 'Update user' },
  { method: 'DELETE', path: '/api/user', require: { anyRole: ['superadmin'] }, description: 'Delete users' },
  
  { method: 'GET', path: '/api/roles', require: { anyRole: ['admin'] }, description: 'List roles' },
  { method: 'GET', path: '/api/groups', require: { anyRole: ['admin'] }, description: 'List groups' },
  // RBAC management (superadmin only)
  { method: 'POST', path: '/api/roles', require: { anyRole: ['superadmin'] }, description: 'Create role' },
  { method: 'PUT', path: '/api/roles', require: { anyRole: ['superadmin'] }, description: 'Update role' },
  { method: 'DELETE', path: '/api/roles', require: { anyRole: ['superadmin'] }, description: 'Delete role' },
  { method: 'POST', path: '/api/groups', require: { anyRole: ['superadmin'] }, description: 'Create group' },
  { method: 'PUT', path: '/api/groups', require: { anyRole: ['superadmin'] }, description: 'Update group' },
  { method: 'GET', path: '/api/groups/:id', require: { anyRole: ['superadmin'] }, description: 'Get group detail' },
  { method: 'PUT', path: '/api/groups/:id', require: { anyRole: ['superadmin'] }, description: 'Update group by ID' },
  { method: 'DELETE', path: '/api/groups', require: { anyRole: ['superadmin'] }, description: 'Delete group' },
  // invite-codes
  { method: 'GET', path: '/api/invite-codes/list', require: { anyRole: ['admin'] }, description: 'List invite codes' },
  { method: 'POST', path: '/api/invite-codes', require: { anyRole: ['admin'] }, description: 'Create invite codes' },
  { method: 'PUT', path: '/api/invite-codes/:id', require: { anyRole: ['admin'] }, description: 'Update invite code' },
  { method: 'POST', path: '/api/invite-codes/:id/revoke', require: { anyRole: ['admin'] }, description: 'Revoke invite code' },

  // Application routes
  { method: 'POST', path: '/api/application', require: { anyRole: ['admin'] }, description: 'Create application' },
  { method: 'GET', path: '/api/application/list', require: { anyRole: ['admin'] }, description: 'List applications' },
  { method: 'PUT', path: '/api/application/:id', require: { anyRole: ['admin'] }, description: 'Update application' },
  { method: 'POST', path: '/api/application/:id/regenerate-secret', require: { anyRole: ['admin'] }, description: 'Regenerate application secret' },
  { method: 'DELETE', path: '/api/application/:id/revoke', require: { anyRole: ['admin'] }, description: 'Revoke application' },
  { method: 'POST', path: '/api/application/verify-client-secret', require: { level: 'public' }, description: 'Verify application client secret' },

  // Category routes
  { method: 'POST', path: '/api/category', require: { anyRole: ['admin'] }, description: 'Create category' },
  { method: 'DELETE', path: '/api/category', require: { anyRole: ['admin'] }, description: 'Delete category' },
  { method: 'PUT', path: '/api/category', require: { anyRole: ['admin'] }, description: 'Update category' },
  { method: 'GET', path: '/api/category/list', require: { level: 'optional' }, description: 'List categories' },

  // Navigation routes
  { method: 'GET', path: '/api/nav/list', require: { level: 'optional' }, description: 'List navigation items' },
  { method: 'POST', path: '/api/nav', require: { level: 'public' }, description: 'Add navigation item' },
  { method: 'GET', path: '/api/nav', require: { level: 'optional' }, description: 'Get navigation item' },
  { method: 'PUT', path: '/api/nav/audit', require: { anyRole: ['admin'] }, description: 'Audit navigation item' },
  { method: 'GET', path: '/api/nav/reptile', require: { level: 'public' }, description: 'Get reptile navigation items' },
  { method: 'GET', path: '/api/nav/random', require: { level: 'optional' }, description: 'Get random navigation items' },
  { method: 'DELETE', path: '/api/nav', require: { anyRole: ['admin'] }, description: 'Delete navigation item' },
  { method: 'PUT', path: '/api/nav', require: { level: 'authenticated' }, description: 'Update navigation item' },
  { method: 'GET', path: '/api/nav/find', require: { level: 'optional' }, description: 'Find navigation item' },
  { method: 'GET', path: '/api/nav/ranking', require: { level: 'optional' }, description: 'Get navigation rankings' },
  { method: 'POST', path: '/api/nav/:id/view', require: { level: 'public' }, description: 'Increment navigation view count' },
  { method: 'POST', path: '/api/nav/:id/star', require: { level: 'public' }, description: 'Increment navigation star count' },

  // Tag routes
  { method: 'POST', path: '/api/tag', require: { anyRole: ['admin'] }, description: 'Create tag' },
  { method: 'DELETE', path: '/api/tag', require: { anyRole: ['admin'] }, description: 'Delete tag' },
  { method: 'PUT', path: '/api/tag', require: { anyRole: ['admin'] }, description: 'Update tag' },
  { method: 'GET', path: '/api/tag/list', require: { level: 'public' }, description: 'List tags' },

  // URL Checker routes
  { method: 'GET', path: '/api/url-checker/status', require: { level: 'public' }, description: 'Get URL checker status' },
  { method: 'POST', path: '/api/url-checker/start', require: { anyRole: ['admin'] }, description: 'Start URL checker' },
  { method: 'POST', path: '/api/url-checker/stop', require: { anyRole: ['admin'] }, description: 'Stop URL checker' },
  { method: 'POST', path: '/api/url-checker/restart', require: { anyRole: ['admin'] }, description: 'Restart URL checker' },
  { method: 'PUT', path: '/api/url-checker/config', require: { anyRole: ['admin'] }, description: 'Update URL checker config' },
  { method: 'POST', path: '/api/url-checker/check', require: { anyRole: ['admin'] }, description: 'Trigger URL check' },
  { method: 'POST', path: '/api/url-checker/check/:id', require: { anyRole: ['admin'] }, description: 'Check specific URL' },
  { method: 'GET', path: '/api/url-checker/nav-status', require: { level: 'public' }, description: 'Get navigation URL status' },
  // Favorite routes - require authentication
  { method: 'POST', path: '/api/favorites', require: { level: 'authenticated' }, description: 'Add favorite nav item' },
  { method: 'POST', path: '/api/favorites/remove', require: { level: 'authenticated' }, description: 'Remove favorite nav item' },
  { method: 'GET', path: '/api/favorites/list', require: { level: 'authenticated' }, description: 'Get favorites list' },
  { method: 'GET', path: '/api/favorites/structured', require: { level: 'authenticated' }, description: 'Get structured favorites (folders + items)' },
  { method: 'POST', path: '/api/favorites/folders', require: { level: 'authenticated' }, description: 'Create favorite folder' },
  { method: 'PUT', path: '/api/favorites/folders/:id', require: { level: 'authenticated' }, description: 'Update favorite folder' },
  { method: 'DELETE', path: '/api/favorites/folders/:id', require: { level: 'authenticated' }, description: 'Delete favorite folder' },
  { method: 'PUT', path: '/api/favorites/placements', require: { level: 'authenticated' }, description: 'Bulk reorder/move favorites and folders' },
  { method: 'GET', path: '/api/favorites/check', require: { level: 'authenticated' }, description: 'Get item check favorite status' },
  { method: 'GET', path: '/api/favorites/count', require: { level: 'authenticated' }, description: 'Get favorites count' },
];

// Helper function to find route permission
export function getRoutePermission(method: string, path: string): RoutePermission | undefined {
  // Handle path parameters like /api/nav/:id
  const normalizedPath = path.split('?')[0]; // Remove query parameters

  // Try exact match first
  let permission = routePermissions.find(
    p => p.method === method && p.path === normalizedPath,
  );

  if (permission) return permission;

  // Try pattern matching for paths with parameters
  const pathParts = normalizedPath.split('/');
  permission = routePermissions.find(p => {
    if (p.method !== method) return false;

    const routeParts = p.path.split('/');
    if (pathParts.length !== routeParts.length) return false;

    // Check if each part matches or is a parameter
    return routeParts.every((part, index) => {
      return part.startsWith(':') || part === pathParts[index];
    });
  });

  return permission;
}

// Check if user has required access level;
export function hasAccess(permission: RoutePermission, user: AuthUserContext | undefined): boolean {
  const req = permission.require;
  if (!req) return !!user; // default to authenticated
  if (req.level === 'public' || req.level === 'optional') return true;
  if (!user) return false;
  // superadmin bypass (role-based)
  if (Array.isArray(user.roles) && user.roles.includes('superadmin')) return true;
  if (req.level === 'authenticated') return true;

  const roles: string[] = Array.isArray(user.roles) ? user.roles : [];
  const groups: string[] = Array.isArray(user.groups) ? user.groups : [];
  const perms: string[] = Array.isArray(user.permissions) ? user.permissions : [];

  if (req.anyRole && req.anyRole.some(r => roles.includes(r))) return true;
  if (req.anyGroup && req.anyGroup.some(g => groups.includes(g))) return true;
  if (req.anyPermission && req.anyPermission.some(p => perms.includes(p) || perms.includes('*'))) return true;
  if (req.allPermissions && req.allPermissions.every(p => perms.includes(p) || perms.includes('*'))) return true;
  return false;
}
