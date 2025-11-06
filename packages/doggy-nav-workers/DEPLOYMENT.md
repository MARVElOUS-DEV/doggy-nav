# Doggy Nav Worker Deployment Guide

This guide covers the deployment of the Cloudflare Workers backend for Doggy Nav.

## Prerequisites

### Required Tools

- [Node.js](https://nodejs.org/) (v20.17.0 or later)
- [pnpm](https://pnpm.io/) package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update) for Cloudflare Workers
- [Git](https://git-scm.com/) for version control

### Cloudflare Account Setup

1. Create a Cloudflare account at [cloudflare.com](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages in the dashboard
3. Set up billing (Workers has a free tier with limitations)
4. Install Wrangler CLI: `npm install -g wrangler`
5. Authenticate Wrangler: `wrangler login`

## Environment Variables

### Required Environment Variables

```bash
# Database Configuration
D1_DATABASE_ID="your-d1-database-id"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key-min-32-chars"

# Node Environment
NODE_ENV="production"  # or "development", "staging"
```

### Setting Environment Variables

#### Using Wrangler CLI

```bash
# Production environment
wrangler vars set JWT_SECRET "your-jwt-secret-key"
wrangler vars set NODE_ENV "production"

# Development environment
wrangler dev --env development
```

#### Using wrangler.toml

```toml
[vars]
JWT_SECRET = "your-jwt-secret-key"
NODE_ENV = "production"
```

## Database Setup

### Creating D1 Database

1. In Cloudflare dashboard, go to Workers & Pages
2. Select your Worker or create a new one
3. Go to D1 tab and create a new database
4. Note the Database ID for wrangler.toml configuration

### Running Migrations

```bash
# Apply all migrations
wrangler d1 migrations apply <database-name>

# Check migration status
wrangler d1 migrations list <database-name>

# Reset database (development only)
wrangler d1 execute <database-name> --file=./migrations/001_init.sql --remote
```

## Initial Data Seeding (Defaults & Categories)

You can seed the D1 database without local CLI using token‑gated Worker endpoints, or via CLI scripts.

### Option A: Seed via Cloudflare Dashboard (recommended)

1. In your Worker → Settings → Variables, add secrets:
   - SEED_TOKEN: a strong random token (required)
   - ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NICKNAME (optional; defaults provided)
2. Ensure schema is applied (see “Running Migrations”, or paste `migrations/001_init.sql` in D1 → Query).
3. Invoke the seed endpoints (idempotent; safe to re‑run):

```bash
curl -X POST "https://<your-worker>.<account>.workers.dev/api/seed/defaults?token=<SEED_TOKEN>"
curl -X POST "https://<your-worker>.<account>.workers.dev/api/seed/categories?token=<SEED_TOKEN>"
```

Notes:

- Endpoints are protected by SEED_TOKEN and record completion in `system_meta` to avoid duplicates.
- After seeding, you may rotate/remove SEED_TOKEN.

### Option B: Seed via CLI (Wrangler)

```bash
# Defaults (admin, roles, group)
pnpm -F doggy-nav-workers run d1:seed:defaults --remote

# Categories & bookmarks
pnpm -F doggy-nav-workers run d1:seed:categories --remote
```

These scripts call `wrangler d1 execute` under the hood and are also idempotent.

## Deployment Steps

### 1. Development Deployment

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# This will start the worker locally with hot reloading
```

### 2. Staging Deployment

```bash
# Create a staging environment
wrangler publish --env staging

# Test the deployment
curl https://your-worker-staging.workers.dev/api/health
```

### 3. Production Deployment

```bash
# Build and deploy to production
wrangler publish

# Verify deployment
curl https://your-worker.workers.dev/api/health
```

### Environment Variables Template (.env.example)

```bash
# Database
D1_DATABASE_ID="your-d1-database-id"

# JWT Secret (minimum 32 characters)
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-characters"

# Environment
NODE_ENV="production"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloudflare Workers
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Build
        run: pnpm run types

      - name: Publish to Cloudflare Workers
        env:
          CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
          D1_DATABASE_ID: ${{ secrets.D1_DATABASE_ID }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: |
          wrangler deploy
```

### Required GitHub Secrets

- `CF_API_TOKEN`: Cloudflare API token with Workers Edit permission
- `D1_DATABASE_ID`: D1 database ID
- `JWT_SECRET`: JWT secret key

## Monitoring and Logging

### Built-in Observability

Cloudflare Workers provides built-in observability:

```bash
# View logs
wrangler tail

# View metrics
wrangler metrics
```

### Custom Logging

The application includes structured logging:

```typescript
console.log('User login successful', {
  userId: user.id,
  timestamp: new Date().toISOString(),
  ip: request.headers.get('CF-Connecting-IP'),
});
```

## Health Checks

### API Endpoints

- `GET /api/health` - Basic health check
- `GET /api/migration/validate` - Database validation
- `GET /api/metrics` - Application metrics (if implemented)

### Monitoring Setup

Set up monitoring for:

1. **Response Times**: API endpoints should respond within 500ms
2. **Error Rates**: Monitor 4xx and 5xx responses
3. **Database Connections**: Ensure D1 connections are healthy
4. **Authentication**: Monitor login success/failure rates

## Backup and Recovery

### Database Backups

D1 databases are automatically backed up by Cloudflare, but you can also:

```bash
# Export database
wrangler d1 backup create <database-name> --backup-name "backup-$(date +%Y%m%d)"

# List backups
wrangler d1 backup list <database-name>

# Restore from backup
wrangler d1 backup restore <database-name> --backup-name "backup-name"
```

### Application Rollback

```bash
# List previous deployments
wrangler deployments list

# Rollback to previous version
wrangler deployments rollback <deployment-id>
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check D1 database status
wrangler d1 status <database-name>

# Verify database ID in wrangler.toml matches Cloudflare dashboard
```

#### 2. JWT Authentication Failures

```bash
# Verify JWT_SECRET is set and matches expected format
# Check that tokens are being sent in Authorization header
```

#### 3. CORS Issues

```bash
# Verify CORS configuration in src/index.ts
# Check that origin matches your frontend domain
```

#### 4. Migration Failures

```bash
# Check migration status
wrangler d1 migrations list <database-name>

# Re-run migrations
wrangler d1 migrations apply <database-name>
```

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` and check logs:

```bash
wrangler tail
```

## Performance Optimization

### Caching Strategy

Workers automatically cache responses at the edge. For optimal performance:

1. **Cache Static Assets**: Use Cloudflare CDN for static files
2. **Cache API Responses**: Implement response caching where appropriate
3. **Minimize Database Calls**: Use connection pooling and query optimization

### Size Optimization

- Keep worker bundle under 1MB for optimal cold start times
- Use tree shaking to remove unused code
- Minimize dependencies

## Security Considerations

### JWT Security

- Use strong, randomly generated JWT_SECRET (minimum 32 characters)
- Set appropriate token expiration times
- Implement token refresh mechanism
- Store secrets securely using Wrangler's secret management

### Database Security

- Use parameterized queries to prevent SQL injection
- Validate all user inputs
- Implement proper access controls
- Regular security audits

### Rate Limiting

Consider implementing rate limiting for public endpoints:

```typescript
// Example rate limiting middleware
app.use('/api/auth/*', rateLimitMiddleware);
```

## Support

For issues and support:

1. Check Cloudflare Workers documentation
2. Review Cloudflare status page for service issues
3. Monitor application logs for errors
4. Test with `wrangler dev` before deploying

## Version History

- v1.0.0: Initial Cloudflare Workers deployment
- v1.1.0: Added authentication and user management
- v1.2.0: Added role-based access control
- v1.3.0: Added data migration tools
