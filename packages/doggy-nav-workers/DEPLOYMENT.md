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

## Database Setup

### Creating D1 Database

1. In Cloudflare dashboard, go to Workers & Pages
2. Select your Worker or create a new one
3. Go to D1 tab and create a new database
4. Running migrations from wrangler cli or copy the migration sql file contents to execute them in the D1 database web console from cloudflare.

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

### Using github actions to deploy server and db initialization

• Get CF_ACCOUNT_ID:

     •  Cloudflare Dashboard → Workers & Pages → Account Home (shows Account ID), or run locally: wrangler whoami (after
        wrangler login).

• Create CF_API_TOKEN:

     •  Dashboard → My Profile → API Tokens → Create Token → use “Edit Cloudflare Workers” template AND add “Account: D1
        Database: Edit” permission (least privilege; add KV/R2 if you use them) → Scope to your account → Create → copy token.

• Add to GitHub:

     •  Repo → Settings → Secrets and variables → Actions → New repository secret → add CF_ACCOUNT_ID (the ID) and CF_API_TOKEN
        (the token).

• Run the manual workflow:

     •  GitHub → Actions → “Deploy Workers (Manual)” → Run workflow.

### 1. Production Deployment

```bash
# Build and deploy to production
wrangler publish

# Verify deployment
curl https://your-worker.workers.dev/api/health
```

### Environment Variables Template (see .dev.vars.example)

### Built-in Observability

Cloudflare Workers provides built-in observability:

```bash
# View logs
wrangler tail

# View metrics
wrangler metrics
```

## Health Checks

### API Endpoints

- `GET /api/health` - Basic health check
- `GET /api/migration/validate` - Database validation

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
