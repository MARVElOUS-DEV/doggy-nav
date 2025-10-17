# 🐕 Doggy Nav

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.17.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![CI/CD](https://github.com/MARVElOUS-DEV/doggy-nav/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/MARVElOUS-DEV/doggy-nav/actions)

_A modern, self-hosted navigation and bookmark management system_

[🚀 Features](#-features) • [📦 Quick Start](#-quick-start) • [🔧 Development](#-development) • [🐳 Docker](#-docker-deployment) • [📖 Documentation](#-documentation)

</div>

---

## 📝 Overview

Doggy Nav is a comprehensive navigation and bookmark management system designed for teams and individuals. Built with modern web technologies, it provides a clean, intuitive interface for organizing and sharing bookmarks across different environments.

### 🎯 Use Cases

- **Team Bookmark Management** - Shared bookmarks for development teams
- **Personal Navigation Hub** - Private bookmark organization
- **Cloud-Based SaaS** - Multi-tenant bookmark service
- **Enterprise Portal** - Internal company navigation system

## ✨ Features

### 🌟 Core Features

- **📚 Smart Organization** - Categories, tags, and search functionality
- **👥 Multi-User Support** - User authentication and permissions
- **⭐ Favorites System** - Quick access to frequently used bookmarks
- **📊 Analytics Dashboard** - View counts and popularity metrics
- **🔍 Advanced Search** - Full-text search with filters
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

### 🛠 Technical Features

- **🚀 High Performance** - Built with Next.js and modern frameworks
- **🔒 Security First** - JWT authentication, input validation
- **🐳 Docker Ready** - Easy deployment with Docker containers
- **📈 Scalable Architecture** - Microservices-based design
- **🔄 Real-time Updates** - Live data synchronization
- **🌐 Internationalization** - Multi-language support (English, Chinese)

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Admin Panel   │    │   Backend API   │
│   (Next.js)     │◄──►│   (UmiJS)       │◄──►│   (Egg.js)      │
│   Port: 3001    │    │   Port: 8080    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │    MongoDB      │
                    │   Port: 27017   │
                    └─────────────────┘
```

### 📁 Project Structure

```
doggy-nav/
├── packages/
│   ├── doggy-nav-main/     # Next.js frontend application
│   ├── doggy-nav-server/   # Egg.js backend API
│   └── doggy-nav-admin/    # UmiJS admin panel
├── deploy/                 # Deployment configurations
├── scripts/                # Build and deployment scripts
├── .github/workflows/      # GitHub Actions CI/CD
└── docs/                   # Documentation
```

## 📦 Quick Start

### ⚡ One-Click Docker Deployment

```bash
# Clone the repository
git clone https://github.com/MARVElOUS-DEV/doggy-nav.git
cd doggy-nav

# Start with Docker Compose
cp .env.docker.example .env
docker-compose up -d

# Access the applications
echo "🎉 Doggy Nav is running!"
echo "Frontend: http://localhost:3001"
echo "Backend API: http://localhost:3002"
echo "Admin Panel: http://localhost:8080"
```

### 🛠 Development Setup

#### Prerequisites

- **Node.js** ≥ 20.17.0
- **pnpm** ≥ 8.0.0
- **MongoDB** ≥ 7.0
- **Git**

#### Installation

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

#### 🚀 Development URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002
- **Admin Panel**: http://localhost:3000 (UmiJS default)

## 🐳 Docker Deployment

### 🎯 Production Deployment

```bash
# Build and deploy all services
./scripts/deploy.sh production

# Or deploy specific environment
./scripts/deploy.sh staging
./scripts/deploy.sh docker
```

### 🔧 Custom Docker Build

```bash
# Build all images
./scripts/docker-build.sh

# Build specific service
./scripts/docker-build.sh --service main    # Frontend only
./scripts/docker-build.sh --service server  # Backend only
./scripts/docker-build.sh --service admin   # Admin only
```

### 📋 Docker Services

| Service  | Image                | Port  | Description             |
| -------- | -------------------- | ----- | ----------------------- |
| Frontend | `doggy-nav-frontend` | 3001  | Next.js web application |
| Backend  | `doggy-nav-backend`  | 3002  | Egg.js API server       |
| Admin    | `doggy-nav-admin`    | 8080  | UmiJS admin panel       |
| Database | `mongo:7.0`          | 27017 | MongoDB database        |

## 🔧 Development

### 📝 Available Scripts

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
pnpm --filter doggy-nav-server test-local  # Backend tests only

# Linting
pnpm --filter doggy-nav-server lint        # Backend linting
pnpm --filter doggy-nav-main lint          # Frontend linting
pnpm --filter doggy-nav-admin lint         # Admin panel linting
```

### 🗃 Database Setup

The application uses MongoDB with automatic initialization:

```bash
# Using Docker (Recommended)
docker-compose -f docker-compose.dev.yml up -d

# Manual MongoDB setup
mongosh
use doggy_nav
# Database will be initialized automatically on first run
```

### 🔐 Environment Configuration

#### Backend (.env.local)

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

#### Frontend (.env.local)

```bash
# Build Configuration
ANALYZE=false
SERVER_URL=http://localhost:3002
```

### Environment Variables Reference

#### Backend (packages/doggy-nav-server)

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

#### Frontend (packages/doggy-nav-main)

| Variable   | Required (prod) | Default               | Description                                        |
| ---------- | --------------- | --------------------- | -------------------------------------------------- |
| SERVER_URL | Recommended     | http://localhost:3002 | Backend base URL used by Next.js API proxy routes. |
| ANALYZE    | Optional        | false                 | Enable bundle analyzer.                            |

#### Admin (packages/doggy-nav-admin)

| Variable                   | Required | Default               | Description                                                                                            |
| -------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| DOGGY_SERVER               | No       | http://localhost:3002 | Dev proxy target for API.                                                                              |
| DOGGY_SERVER_CLIENT_SECRET | Optional | (unset)               | If REQUIRE_CLIENT_SECRET=true, set to your server client secret; injected by proxy as x-client-secret. |

## 🚀 Deployment

### ☁️ Cloud Platforms

#### Vercel (Frontend Only)

```bash
# Deploy frontend to Vercel
cd packages/doggy-nav-main
vercel --prod

# Set environment variables in Vercel dashboard:
# SERVER_URL=https://your-backend-url.com
```

#### Railway/DigitalOcean (Full Stack)

```bash
# 1. Deploy backend first
# 2. Deploy frontend with backend URL
# 3. Deploy admin panel
# See DEPLOYMENT.md for detailed instructions
```

#### Docker Platforms

```bash
# Deploy to any Docker-compatible platform
docker-compose up -d

# Or use our deployment script
./scripts/deploy.sh docker
```

## 📖 Documentation

### 📚 Additional Docs

- [🧭 Repository Guidelines](AGENTS.md) - Monorepo structure, workflow, and contributor expectations
- [🐳 Docker Guide](DOCKER.md) - Comprehensive Docker deployment
- [🚀 Deployment Guide](DEPLOYMENT.md) - Cloud deployment instructions
- [🔄 CI/CD Guide](CI-CD.md) - Continuous integration setup
- [🛠 API Documentation](docs/API.md) - Backend API reference

### 🏗 Development Guides

- [Frontend Development](packages/doggy-nav-main/README.md)
- [Backend Development](packages/doggy-nav-server/README.md)
- [Admin Panel Development](packages/doggy-nav-admin/README.md)

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

## 🛡 Security

### 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - API request throttling
- **Input Validation** - SQL injection prevention
- **CORS Protection** - Cross-origin request security
- **Environment Variables** - Secret management

### 📝 Security Policy

- Report security vulnerabilities privately via email
- Security updates are prioritized and released quickly
- We follow responsible disclosure practices

## 📊 Performance

### ⚡ Optimization Features

- **Next.js SSG/SSR** - Fast page loads
- **MongoDB Indexing** - Optimized database queries
- **Docker Multi-stage** - Minimal container sizes
- **CDN Ready** - Static asset optimization
- **Caching Strategies** - Redis support for sessions

### 📈 Monitoring

- Health check endpoints
- Performance metrics
- Error tracking and logging
- Resource usage monitoring

## 🌍 Roadmap

### 🎯 Upcoming Features

- [ ] **Browser Extension** - Quick bookmark addition
- [ ] **API Rate Limiting** - Advanced request throttling
- [ ] **SSO Integration** - LDAP/OAuth support
- [ ] **Advanced Analytics** - Detailed usage insights
- [ ] **Mobile App** - Native iOS/Android apps
- [ ] **Plugin System** - Extensible architecture

### 🔄 Recent Updates

- [x] **Docker Optimization** - Multi-stage builds
- [x] **CI/CD Pipeline** - Automated testing & deployment
- [x] **Modern UI** - Updated design system
- [x] **Performance** - Database indexing & caching

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

### 💝 Special Thanks

- **Contributors** - All the amazing developers who helped build this
- **Open Source Community** - For the incredible tools and libraries
- **Beta Testers** - For valuable feedback and bug reports

### 🛠 Built With

- [Next.js](https://nextjs.org/) - React framework
- [Egg.js](https://eggjs.org/) - Node.js backend framework
- [UmiJS](https://umijs.org/) - React application framework
- [MongoDB](https://mongodb.com/) - NoSQL database
- [Docker](https://docker.com/) - Containerization
- [Arco Design](https://arco.design/) - UI component library

### 🎉 Sponsors

[![Github Sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/bin456789)

[![Powered by DartNode](https://dartnode.com/branding/DN-Open-Source-sm.png)](https://dartnode.com 'Powered by DartNode - Free VPS for Open Source')

---

<div align="center">

**[⬆ Back to Top](#-doggy-nav)**

Made with ❤️ by [Marvelous](https://github.com/MARVElOUS-DEV)

_If you find this project helpful, please consider giving it a ⭐!_

</div>
