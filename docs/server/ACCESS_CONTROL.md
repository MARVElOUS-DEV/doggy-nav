# Access Control System

This document explains the new access control system that replaces the simple whitelist approach.

## Access Levels

The system supports 4 access levels:

1. **public** - No authentication required (anonymous access)
2. **authenticated** - Valid JWT token or client secret required
3. **admin** - Authenticated user with isAdmin flag set to true
4. **optional** - Authentication is optional; user info provided if available

## Route Configuration

Route permissions are defined in `config/access-control.js`:

```javascript
{
  method: 'GET',           // HTTP method
  path: '/api/nav/list',   // Route path (supports parameters like /api/nav/:id)
  access: 'public',        // Access level
  description: 'List navigation items'  // Human-readable description
}
```

## Adding New Routes

To add a new route, simply add an entry to the `routePermissions` array in `config/access-control.js`:

```javascript
// Example: Admin-only route
{ method: 'DELETE', path: '/api/admin/users/:id', access: 'admin', description: 'Delete user' }

// Example: Authenticated users only
{ method: 'POST', path: '/api/profile', access: 'authenticated', description: 'Update profile' }

// Example: Public access
{ method: 'GET', path: '/api/public/info', access: 'public', description: 'Public information' }
```

## Testing Access

You can test access control using curl:

```bash
# Public route - no authentication needed
curl http://localhost:3002/api/nav/list

# Authenticated route - with JWT token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3002/api/user/profile

# Authenticated route - with client secret
curl -H "X-Client-Secret: YOUR_CLIENT_SECRET" http://localhost:3002/api/user/profile

# Admin route - requires admin privileges
curl -H "Authorization: Bearer ADMIN_JWT_TOKEN" http://localhost:3002/api/category
```

## Error Responses

- **401 Unauthorized** - Authentication required but not provided or invalid
- **403 Forbidden** - Authentication successful but insufficient permissions
- **403 Forbidden** - Route not configured (secure by default)

## Security Notes

1. Routes not explicitly configured default to requiring authentication (secure by default)
2. Client secret authentication and JWT token authentication are both supported
3. Admin routes require both authentication and isAdmin flag
4. Optional routes provide user info when available but don't require authentication
