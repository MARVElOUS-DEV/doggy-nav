# Development Guide

## Prerequisites

- Node.js ≥ 20.17.0
- pnpm ≥ 8.0.0
- MongoDB ≥ 7.0
- Git

## Installation

```bash
# 1. Clone and install dependencies
git clone https://github.com/MARVElOUS-DEV/doggy-nav.git
cd doggy-nav
pnpm install

# 2. Set up environment variables
cp packages/doggy-nav-server/.env.example packages/doggy-nav-server/.env.local

# 3. Start MongoDB (if not using Docker)
# Using MongoDB locally or Docker:
docker run -d -p 27017:27017 --name doggy-mongo mongo:7.0

# 4. Start development servers
pnpm server:dev    # Backend (Terminal 1)
pnpm web:dev       # Frontend (Terminal 2)
pnpm admin:dev     # Admin Panel (Terminal 3)
```

## Development URLs

- Frontend: http://localhost:3001
- Backend API: http://localhost:3002
- Admin Panel: http://localhost:3000 (UmiJS default)

## Available Scripts

```bash
# Development
pnpm server:dev     # Start backend development server
pnpm web:dev        # Start frontend development server
pnpm admin:dev      # Start admin panel development server

# Building
pnpm build          # Build all packages
pnpm web:build      # Build frontend only
pnpm server:build   # Build backend only
pnpm admin:build    # Build admin panel only

# Testing
pnpm test           # Run all tests
pnpm -F doggy-nav-server test-local  # Backend tests only

# Linting
pnpm -F doggy-nav-server lint        # Backend linting
pnpm -F doggy-nav-main lint          # Frontend linting
pnpm -F doggy-nav-admin lint         # Admin panel linting
```

## Database Setup

The application uses MongoDB with automatic initialization:

```bash
# Using Docker (Recommended)
docker compose -f deploy/docker-compose-db.yml up -d

# Manual MongoDB setup
mongosh
use navigation
# Database will be initialized automatically on first run
```

## Environment Configuration

### Backend (.env.local)

```bash
# Server Configuration
PORT=3002
NODE_ENV=development

# Database
MONGO_URL=mongodb://localhost:27017/doggy_nav

# Security
JWT_SECRET=your-super-secure-jwt-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (.env.local)

```bash
# Build Configuration
ANALYZE=false
DOGGY_SERVER=http://localhost:3002
```

## Environment Variables Reference

### Backend (packages/doggy-nav-server)

| Variable                  | Required (prod) | Default                               | Description                                                                                          |
| ------------------------- | --------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| NODE_ENV                  | No              | development                           | Node environment.                                                                                    |
| PORT                      | No              | 3002                                  | API server port.                                                                                     |
| MONGO_URL                 | No              | 127.0.0.1:27017 (or full SRV)         | If a mongodb+srv URL is provided, it’s used as-is; otherwise host:port and DB “navigation” are used. |
| JWT_SECRET                | Yes             | a_super_secure_token                  | HMAC secret for signing JWTs.                                                                        |
| JWT_ACCESS_EXPIRES_IN     | No              | 15m                                   | Access token lifetime.                                                                               |
| JWT_REFRESH_EXPIRES_IN    | No              | 7d                                    | Refresh token lifetime.                                                                              |
| COOKIE_KEYS               | Recommended     | appInfo.name + \_doggy_nav_cookie_key | Signed-cookie key(s) for Egg; set a stable value to avoid logouts on restart.                        |
| COOKIE_DOMAIN             | Optional        | (unset)                               | Cookie domain (set for cross-subdomain auth).                                                        |
| CORS_ORIGIN               | Optional        | http://localhost:3000                 | Comma-separated allowed origins.                                                                     |
| REQUIRE_INVITE_CODE       | Optional        | false                                 | Enable invite-only local registration.                                                               |
| REQUIRE_CLIENT_SECRET     | Optional        | false                                 | Require x-client-secret on all APIs (except bypass routes).                                          |
| PUBLIC_BASE_URL           | Optional        | (unset)                               | OAuth success redirect base URL.                                                                     |
| GITHUB_CLIENT_ID          | Optional        | (unset)                               | GitHub OAuth.                                                                                        |
| GITHUB_CLIENT_SECRET      | Optional        | (unset)                               | GitHub OAuth.                                                                                        |
| GITHUB_CALLBACK_URL       | Optional        | (unset)                               | GitHub OAuth callback.                                                                               |
| GOOGLE_CLIENT_ID          | Optional        | (unset)                               | Google OAuth.                                                                                        |
| GOOGLE_CLIENT_SECRET      | Optional        | (unset)                               | Google OAuth.                                                                                        |
| GOOGLE_CALLBACK_URL       | Optional        | (unset)                               | Google OAuth callback.                                                                               |
| LINUXDO_CLIENT_ID         | Optional        | (unset)                               | LinuxDo OAuth.                                                                                       |
| LINUXDO_CLIENT_SECRET     | Optional        | (unset)                               | LinuxDo OAuth.                                                                                       |
| LINUXDO_CALLBACK_URL      | Optional        | (unset)                               | LinuxDo OAuth callback.                                                                              |
| LINUXDO_AUTHORIZATION_URL | Optional        | (unset)                               | LinuxDo OAuth auth URL.                                                                              |
| LINUXDO_TOKEN_URL         | Optional        | (unset)                               | LinuxDo OAuth token URL.                                                                             |
| LINUXDO_PROFILE_URL       | Optional        | (unset)                               | LinuxDo user profile URL.                                                                            |
| LINUXDO_SCOPE             | Optional        | (unset)                               | Comma-separated scopes for LinuxDo.                                                                  |

### Frontend (packages/doggy-nav-main)

| Variable                   | Required (prod) | Default               | Description                                                                                            |
| -------------------------- | --------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| DOGGY_SERVER               | Recommended     | http://localhost:3002 | Backend base URL used by Next.js API proxy routes.                                                     |
| ANALYZE                    | Optional        | false                 | Enable bundle analyzer.                                                                                |
| DOGGY_SERVER_CLIENT_SECRET | Optional        | (unset)               | If REQUIRE_CLIENT_SECRET=true, set to your server client secret; injected by proxy as x-client-secret. |

### Admin (packages/doggy-nav-admin)

| Variable                   | Required | Default               | Description                                                                                            |
| -------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| DOGGY_SERVER               | No       | http://localhost:3002 | Dev proxy target for API.                                                                              |
| DOGGY_SERVER_CLIENT_SECRET | Optional | (unset)               | If REQUIRE_CLIENT_SECRET=true, set to your server client secret; injected by proxy as x-client-secret. |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 🔄 Development Workflow

0. **Review the repo guide**  
   Skim through [AGENTS.md](AGENTS.md) to understand coding standards, testing expectations, and commit conventions.

1. **Fork & Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/doggy-nav.git
   cd doggy-nav
   ```

2. **Create Feature Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Install & Setup**

   ```bash
   pnpm install
   cp packages/doggy-nav-server/.env.example packages/doggy-nav-server/.env.local
   ```

4. **Develop & Test**

   ```bash
   pnpm server:dev  # Start backend
   pnpm web:dev     # Start frontend
   pnpm admin:dev     # Start frontend
   pnpm workers:dev     # Start frontend
   pnpm test        # Run tests
   ```

5. **Commit & Push**

   ```bash
   pnpm commit      # Use conventional commits
   git push origin feature/amazing-feature
   ```

6. **Create Pull Request**

### 📋 Contribution Guidelines

- **Code Style**: ESLint + Prettier (auto-formatted)
- **Commits**: Use [Conventional Commits](https://conventionalcommits.org/)
- **Testing**: Add tests for new features
- **Documentation**: Update docs for API changes

### 🐛 Bug Reports

Found a bug? Please create an issue with:

- **Environment details** (OS, Node.js version, etc.)
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
