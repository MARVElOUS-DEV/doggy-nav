# Client Secret Authentication

This document describes the client secret authentication system that protects ALL API endpoints.

## Overview

The client secret authentication system requires API clients to provide a valid client secret for **ALL API endpoints** when enabled. This is a first-layer authentication that happens before any user authentication, providing API-level access control and usage tracking.

## Key Features

- **Universal Protection**: When enabled, ALL API endpoints require a valid client secret
- **First-Layer Security**: Client secret verification happens BEFORE user authentication
- **Standalone API Keys**: Client secrets are independent of users - they're pure API keys
- **Admin-Managed**: Only administrators can create and manage client secrets

## Configuration

### Environment Variables

Set the following environment variable to enable client secret requirement for ALL APIs:

```bash
REQUIRE_CLIENT_SECRET=true
```

### Configuration Options

The client secret configuration is located in `config/config.default.ts`:

```typescript
config.clientSecret = {
  // Enable/disable client secret requirement for ALL APIs
  requireForAllAPIs: process.env.REQUIRE_CLIENT_SECRET === 'true' || false,

  // Header name for client secret (default: x-client-secret)
  headerName: 'x-client-secret',

  // Allow specific routes to bypass client secret requirement
  // These are essential routes for initial setup
  bypassRoutes: ['/api/register', '/api/login', '/api/application/verify-client-secret'],
};
```

## Usage

### Creating Applications (Client Secrets)

1. **Admin Access Required**: Only admin users can create and manage client secrets
2. **Create Client Secret**: POST `/api/application`

```bash
curl -X POST http://localhost:3002/api/application \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My API Client",
    "description": "Client for mobile app",
    "allowedOrigins": ["https://example.com"]
  }'
```

Response:

```json
{
  "code": 200,
  "data": {
    "_id": "application_id",
    "name": "My API Client",
    "clientSecret": "generated_64_character_hex_string",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Using Client Secrets

When `requireForAllAPIs` is enabled, **ALL** API calls must include the client secret header:

```bash
# Example: Get navigation list
curl -X GET http://localhost:3002/api/nav/list \
  -H "x-client-secret: your_client_secret_here"

# Example: User login (still needs client secret)
curl -X POST http://localhost:3002/api/login \
  -H "x-client-secret: your_client_secret_here" \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}'

# Example: Authenticated endpoint (needs both client secret AND JWT)
curl -X GET http://localhost:3002/api/user/profile \
  -H "x-client-secret: your_client_secret_here" \
  -H "Authorization: Bearer your_jwt_token"
```

### Managing Applications (Admin Only)

#### List Applications

```bash
# Only admins can view all client secrets
GET /api/application/list?page=1&limit=10
```

#### Update Application

```bash
PUT /api/application/:id
```

#### Regenerate Client Secret

```bash
POST /api/application/:id/regenerate-secret
```

#### Revoke Application

```bash
DELETE /api/application/:id/revoke
```

#### Verify Client Secret

```bash
POST /api/application/verify-client-secret
{
  "clientSecret": "your_client_secret"
}
```

## Authentication Flow

When client secret requirement is enabled, the authentication flow is:

1. **Client Secret Check** (FIRST): Every API call is checked for valid client secret
2. **Route Permission Check** (SECOND): Route-specific access control is applied
3. **User Authentication** (THIRD): JWT token validation for authenticated routes

```
Request → Client Secret Validation → Route Permission → User Auth → Controller
```

### Bypass Routes

Some routes are configured to bypass the client secret requirement even when enabled:

- `/api/register` - User registration
- `/api/login` - User login
- `/api/application/verify-client-secret` - Client secret verification

These bypass routes are essential for initial system setup and client secret management.

## Security Features

1. **Client Secret Format**: 64-character hexadecimal strings
2. **Usage Tracking**: Tracks usage count and last used time
3. **Origin Restriction**: Can restrict to specific allowed origins
4. **Active Status**: Applications can be revoked/deactivated
5. **Universal Protection**: ALL endpoints are protected when enabled
6. **Admin-Only Management**: Only administrators can manage client secrets

## Error Responses

### Missing Client Secret

```json
{
  "code": 401,
  "msg": "请提供客户端密钥",
  "data": null
}
```

### Invalid Client Secret

```json
{
  "code": 401,
  "msg": "无效的客户端密钥",
  "data": null
}
```

### Verification Error

```json
{
  "code": 500,
  "msg": "客户端密钥验证失败",
  "data": null
}
```

## Best Practices

1. **Store Securely**: Keep client secrets secure and don't expose them in client-side code
2. **Regular Rotation**: Regenerate client secrets regularly
3. **Monitor Usage**: Track usage patterns through the provided statistics
4. **Restrict Origins**: Use `allowedOrigins` to limit where the secret can be used
5. **Revoke Unused**: Revoke applications that are no longer needed
6. **Layered Security**: Remember this is the first layer - still use proper user authentication

## Migration

### First Deployment and Web App Integration

1. First deploy with client secret disabled

- Set `REQUIRE_CLIENT_SECRET=false` and deploy the server.
- Login as admin and create the first application via `POST /api/application`.
- Securely store the returned client secret.

2. Configure web apps to send the secret header automatically

- Main (Next.js): set env `SERVER_URL` and `SERVER_CLIENT_SECRET` in your hosting environment. The app forwards requests through Next.js API routes and automatically adds header `x-client-secret: $SERVER_CLIENT_SECRET` when calling the server.
- Admin (Umi): set env `UMI_APP_CLIENT_SECRET` so browser requests include header `x-client-secret: $UMI_APP_CLIENT_SECRET`.

3. Enable client secret requirement

- Set `REQUIRE_CLIENT_SECRET=true` and restart the server.
- Verify calls from both web apps succeed with the `x-client-secret` header.

Notes:

- The admin frontend runs in the browser; putting the secret there exposes it to users. If this is a concern for your deployment, prefer injecting `x-client-secret` via a trusted reverse proxy instead.

### Enabling for Existing System

When enabling client secret requirement for an existing system:

1. **Create Client Secrets**: Have an admin create client secrets for existing API consumers
2. **Distribute Secrets**: Securely distribute client secrets to all API consumers
3. **Update Client Code**: Ensure all API clients include the `x-client-secret` header
4. **Enable Feature**: Set `REQUIRE_CLIENT_SECRET=true` environment variable
5. **Restart Server**: Restart to apply the configuration
6. **Monitor Logs**: Check for any access issues

### Disabling

To disable client secret requirement:

1. Set `REQUIRE_CLIENT_SECRET=false` or remove the environment variable
2. Restart the server
3. All APIs will work without client secrets again (falling back to normal authentication)

## Important Notes

- **Admin Requirement**: Only admin users can create/manage client secrets
- **Universal Scope**: When enabled, ALL endpoints require client secrets (except bypass routes)
- **First Layer**: Client secret check happens BEFORE any user authentication
- **Independent**: Client secrets are not tied to any specific user
- **Bypass Routes**: Essential routes for registration/login remain accessible
