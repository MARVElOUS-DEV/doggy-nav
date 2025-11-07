# Doggy Nav Worker

Cloudflare Workers backend for Doggy Nav, built with Hono framework and D1 database. This worker provides a serverless, edge-computed alternative to the traditional Egg.js/MongoDB backend.

## Features

- **Edge Computing**: Deployed on Cloudflare's global network for low latency
- **Serverless Architecture**: Automatic scaling without server management
- **SQL Database**: Uses Cloudflare D1 (SQLite-based) for structured data
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Fine-grained permission system
- **Data Migration**: Tools for migrating from MongoDB to D1
- **TypeScript**: Full type safety and developer experience
- **Testing**: Comprehensive test suite with Vitest

## Architecture

### Technology Stack

- **Framework**: [Hono](https://hono.dev/) - Ultrafast web framework for Cloudflare Workers
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) - SQLite-based SQL database
- **Authentication**: JWT with secure token management
- **Language**: TypeScript with modern ES modules
- **Testing**: Vitest for unit and integration testing

### Data Model

The worker uses a normalized SQL schema converted from MongoDB collections:

- **Users**: User accounts with authentication data
- **Roles**: Role definitions with permissions
- **Groups**: User groups for organization
- **Categories**: Bookmark categories with hierarchical structure
- **Bookmarks**: Navigation items with metadata
- **Tags**: Tag system for bookmark organization
- **Favorites**: User bookmark favorites with folders

## Getting Started

### Prerequisites

- Node.js v20.17.0+
- pnpm package manager
- Cloudflare account with Workers enabled
- Wrangler CLI installed

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd packages/doggy-nav-workers

# Install dependencies
pnpm install

# Set up environment variables
# Local dev uses Cloudflare's .dev.vars file
cp .dev.vars.example .dev.vars
# Set JWT_SECRET as a Cloudflare secret (not in .dev.vars)
wrangler secret put JWT_SECRET
```

### Development

```bash
# Start development server
pnpm dev

# The worker will be available at localhost:8787
# API endpoints:
# - GET /api/health - Health check
# - POST /api/auth/register - User registration
# - POST /api/auth/login - User login
# - GET /api/groups - List groups
```

### Testing

```bash
# Run test suite
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Watch mode for development
pnpm run test:watch
```

## API Reference

### Authentication

#### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "nickName": "John"
}
```

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### Users

#### Get User Profile (Authenticated)

```http
GET /api/users/me
Authorization: Bearer your-access-token
```

#### Update User Profile (Authenticated)

```http
PUT /api/users/me
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "nickName": "John Doe",
  "phone": "+1234567890"
}
```

### Groups

#### List Groups

```http
GET /api/groups?page=1&limit=50
```

#### Get Group by ID

```http
GET /api/groups/:id
```

### Roles

#### List Roles (Admin)

```http
GET /api/roles?page=1&limit=50
Authorization: Bearer admin-token
```

#### Create Role (Admin)

```http
POST /api/roles
Authorization: Bearer admin-token
Content-Type: application/json

{
  "slug": "moderator",
  "displayName": "Moderator",
  "description": "Content moderator role",
  "permissions": ["content:read", "content:write"]
}
```

## Database Schema

The D1 database uses the following schema:

### Users Table

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  nick_name TEXT DEFAULT '',
  -- ... other fields
);
```

### Roles Table

```sql
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  permissions TEXT DEFAULT '[]',
  is_system INTEGER DEFAULT 0
);
```

### Relationships

- Users ↔ Roles (many-to-many via `user_roles` table)
- Users ↔ Groups (many-to-many via `user_groups` table)
- Categories ↔ Roles/Groups (permission tables)

See `migrations/001_init.sql` for complete schema.

## Configuration

### Environment Variables

```bash
# Required
D1_DATABASE_ID="your-d1-database-id"
JWT_SECRET="your-jwt-secret-key-min-32-chars"
NODE_ENV="development"  # development, staging, production

# Optional
CORS_ORIGIN="https://your-frontend.com"
```

### Wrangler Configuration

See `wrangler.jsonc` for Cloudflare Workers configuration including:

- D1 database bindings
- Environment variables
- Migration configuration
- Observability settings

## Deployment

### Cloudflare Deployment

```bash
# Authenticate with Cloudflare
wrangler login

# Create (or reuse) a D1 database and capture its id
wrangler d1 create doggy_nav
# Export the created database id for this shell (or set it in your CI)
export D1_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export D1_DATABASE_NAME=xxxxxxxx

# Configure environment variables
# (Optional) edit wrangler.toml [vars] for ALLOWED_ORIGINS / rate limits
# (Required secret) set JWT secret
wrangler secret put JWT_SECRET

# Apply SQL migrations to the D1 database
wrangler d1 migrations apply doggy_nav --remote

# Deploy to production
wrangler publish
```

### Staging Deployment

```bash
# Create a staging D1 database
wrangler d1 create doggy_nav_staging
export D1_DATABASE_ID=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy

# Apply migrations to staging DB and deploy
wrangler d1 migrations apply doggy_nav_staging --remote
wrangler publish --env staging
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Data Migration

The worker includes tools for migrating data from MongoDB to D1:

### Migration Endpoints

```http
POST /api/migration/migrate
Authorization: Bearer admin-token

{
  "mongoConnectionString": "mongodb://localhost:27017/navigation",
  "collections": ["users", "roles", "groups", "categories", "bookmarks"]
}
```

```http
GET /api/migration/validate
Authorization: Bearer admin-token
```

### Migration Process

1. **Schema Setup**: Apply D1 migrations
2. **Data Export**: Export from MongoDB collections
3. **Data Transformation**: Convert MongoDB documents to SQL records
4. **Data Import**: Import into D1 database
5. **Validation**: Verify data integrity
6. **Cutover**: Switch applications to new backend

## Contributing

### Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Set up development environment: `cp .env.example .env`
4. Start development server: `pnpm dev`
5. Write tests for new features
6. Run lint and format: `pnpm lint && pnpm format`

### Code Standards

- TypeScript strict mode
- Prettier formatting
- ESLint linting
- Conventional commits
- Comprehensive testing

### Testing

All changes should include appropriate tests:

```bash
# Run all tests
pnpm test

# Check coverage
pnpm run test:coverage

# Test specific functionality
pnpm test -- api.test.ts
```

## Performance

### Optimization Features

- **Edge Caching**: Responses cached at Cloudflare edge locations
- **Connection Pooling**: Efficient D1 database connections
- **Query Optimization**: Parameterized queries with indexes
- **Bundle Size**: Minimal dependencies for fast cold starts

### Monitoring

- Built-in Cloudflare observability
- Structured logging
- Performance metrics
- Error tracking

## Security

### Authentication Security

- JWT tokens with secure signing
- Password hashing with bcrypt
- Token expiration and refresh
- Rate limiting protection

### Data Security

- Parameterized SQL queries
- Input validation and sanitization
- Role-based access control
- Secure environment variables

### Compliance

- GDPR-compliant data handling
- Secure data migration
- Audit logging
- Regular security updates

## Support

### Documentation

- [API Documentation](./docs/api.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Migration Guide](./docs/migration.md)

### Issues

Report issues and bugs in the repository's Issues section.

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Credits

Built with ❤️ using modern web technologies.

- **Hono**: Ultrafast web framework
- **Cloudflare Workers**: Serverless platform
- **D1 Database**: SQL database at the edge
- **TypeScript**: Type-safe development
- **Vitest**: Modern testing framework
