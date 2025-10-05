export type AccessLevel = 'public' | 'authenticated' | 'admin' | 'optional';

export interface RoutePermission {
  method: string;
  path: string;
  access: AccessLevel;
  description?: string;
}

// Route access control matrix
export const routePermissions: RoutePermission[] = [
  // User authentication routes
  { method: 'POST', path: '/api/register', access: 'public', description: 'User registration' },
  { method: 'POST', path: '/api/login', access: 'public', description: 'User login' },
  { method: 'GET', path: '/api/user/profile', access: 'authenticated', description: 'Get user profile' },
  { method: 'PUT', path: '/api/user/profile', access: 'authenticated', description: 'Get user profile' },

  // Application routes
  { method: 'POST', path: '/api/application', access: 'admin', description: 'Create application' },
  { method: 'GET', path: '/api/application/list', access: 'admin', description: 'List applications' },
  { method: 'PUT', path: '/api/application/:id', access: 'admin', description: 'Update application' },
  { method: 'POST', path: '/api/application/:id/regenerate-secret', access: 'admin', description: 'Regenerate application secret' },
  { method: 'DELETE', path: '/api/application/:id/revoke', access: 'admin', description: 'Revoke application' },
  { method: 'POST', path: '/api/application/verify-client-secret', access: 'public', description: 'Verify application client secret' },

  // Category routes
  { method: 'POST', path: '/api/category', access: 'admin', description: 'Create category' },
  { method: 'DELETE', path: '/api/category', access: 'admin', description: 'Delete category' },
  { method: 'PUT', path: '/api/category', access: 'admin', description: 'Update category' },
  { method: 'GET', path: '/api/category/list', access: 'optional', description: 'List categories' },

  // Navigation routes
  { method: 'GET', path: '/api/nav/list', access: 'optional', description: 'List navigation items' },
  { method: 'POST', path: '/api/nav', access: 'optional', description: 'Add navigation item' },
  { method: 'GET', path: '/api/nav', access: 'optional', description: 'Get navigation item' },
  { method: 'PUT', path: '/api/nav/audit', access: 'admin', description: 'Audit navigation item' },
  { method: 'GET', path: '/api/nav/reptile', access: 'public', description: 'Get reptile navigation items' },
  { method: 'GET', path: '/api/nav/random', access: 'optional', description: 'Get random navigation items' },
  { method: 'DELETE', path: '/api/nav', access: 'admin', description: 'Delete navigation item' },
  { method: 'PUT', path: '/api/nav', access: 'authenticated', description: 'Update navigation item' },
  { method: 'GET', path: '/api/nav/find', access: 'optional', description: 'Find navigation item' },
  { method: 'GET', path: '/api/nav/ranking', access: 'optional', description: 'Get navigation rankings' },

  // Tag routes
  { method: 'POST', path: '/api/tag', access: 'admin', description: 'Create tag' },
  { method: 'DELETE', path: '/api/tag', access: 'admin', description: 'Delete tag' },
  { method: 'PUT', path: '/api/tag', access: 'admin', description: 'Update tag' },
  { method: 'GET', path: '/api/tag/list', access: 'public', description: 'List tags' },

  // URL Checker routes
  { method: 'GET', path: '/api/url-checker/status', access: 'public', description: 'Get URL checker status' },
  { method: 'POST', path: '/api/url-checker/start', access: 'admin', description: 'Start URL checker' },
  { method: 'POST', path: '/api/url-checker/stop', access: 'admin', description: 'Stop URL checker' },
  { method: 'POST', path: '/api/url-checker/restart', access: 'admin', description: 'Restart URL checker' },
  { method: 'PUT', path: '/api/url-checker/config', access: 'admin', description: 'Update URL checker config' },
  { method: 'POST', path: '/api/url-checker/check', access: 'admin', description: 'Trigger URL check' },
  { method: 'POST', path: '/api/url-checker/check/:id', access: 'admin', description: 'Check specific URL' },
  { method: 'GET', path: '/api/url-checker/nav-status', access: 'public', description: 'Get navigation URL status' },
  // Favorite routes - require authentication
  { method: 'POST', path: '/api/favorites', access: 'authenticated', description: 'Add favorite nav item' },
  { method: 'POST', path: '/api/favorites/remove', access: 'authenticated', description: 'Remove favorite nav item' },
  { method: 'GET', path: '/api/favorites/list', access: 'authenticated', description: 'Get favorites list' },
  { method: 'GET', path: '/api/favorites/check', access: 'authenticated', description: 'Get item check favorite status' },
  { method: 'GET', path: '/api/favorites/count', access: 'authenticated', description: 'Get favorites count' },
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

// Check if user has required access level
export function hasAccess(permission: RoutePermission, user: any): boolean {
  switch (permission.access) {
  case 'public':
    return true;
  case 'authenticated':
    return !!user;
  case 'admin':
    return !!user && user.isAdmin === true;
  case 'optional':
    return true; // Always allow, but provide user info if available
  default:
    return false;
  }
}
