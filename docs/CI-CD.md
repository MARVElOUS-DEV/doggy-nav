# CI/CD Pipeline Documentation

## Overview

This project uses multiple CI/CD platforms to ensure comprehensive testing and deployment:

- **GitHub Actions** (Primary, Modern)
- **Travis CI** (Cross-platform testing)
- **AppVeyor** (Windows-specific testing)

## Platforms and Configurations

### 🚀 GitHub Actions (Recommended)

**Files**: `.github/workflows/*.yml`

**Features**:

- Multi-OS testing (Ubuntu, Windows, macOS)
- Node.js matrix testing (v20, v22)
- Docker image building and publishing
- Security scanning with CodeQL
- Automated dependency updates
- Comprehensive test coverage

**Workflows**:

1. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
   - Code quality checks (ESLint)
   - Unit tests with MongoDB
   - Build tests across platforms
   - Docker build validation
   - Security scanning
   - Automated deployment

2. **Docker Publishing** (`.github/workflows/docker-publish.yml`)
   - Builds and publishes Docker images
   - Generates SBOM (Software Bill of Materials)
   - Multi-architecture support

3. **Dependency Updates** (`.github/workflows/dependency-update.yml`)
   - Weekly automated dependency updates
   - Security vulnerability scanning
   - Automatic PR creation

### 🔧 Travis CI

**File**: `.travis.yml`

**Features**:

- Multi-OS testing (Linux, macOS)
- Node.js versions: 20, 22, LTS
- MongoDB service integration
- Build stages for organized testing
- Docker build testing
- Coverage reporting to Codecov

**Build Stages**:

1. Code Quality (Linting)
2. Unit Tests
3. Build Tests
4. Docker Tests
5. Coverage Reporting

### 🪟 AppVeyor (Windows)

**File**: `appveyor.yml`

**Features**:

- Windows-specific testing
- Node.js versions: 20, 22
- MongoDB service
- Build artifact collection
- Deployment environments

## Environment Variables

### Required for All Platforms

```bash
NODE_ENV=test
MONGO_URL=mongodb://localhost:27017/doggy_nav_test
JWT_SECRET=test-secret
```

### Platform-Specific

#### GitHub Actions Secrets

```bash
CODECOV_TOKEN=<codecov-token>
SLACK_WEBHOOK_URL=<slack-webhook>
DOCKER_REGISTRY_TOKEN=<registry-token>
```

#### Travis CI Environment Variables

```bash
CODECOV_TOKEN=<codecov-token>
SLACK_TOKEN=<encrypted-slack-token>
```

#### AppVeyor Environment Variables

```bash
SLACK_WEBHOOK=<encrypted-webhook>
```

## Build Process

### 1. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

### 2. Code Quality Checks

```bash
pnpm -F doggy-nav-server lint
pnpm -F doggy-nav-main lint
pnpm -F doggy-nav-admin lint
```

### 3. Unit Testing

```bash
pnpm -F doggy-nav-server test-local
```

### 4. Build Applications

```bash
pnpm build  # All packages
# or individually:
pnpm web:build    # Frontend
pnpm server:build # Backend
pnpm admin:build  # Admin panel
```

### 5. Docker Testing

```bash
docker build -f Dockerfile-Main -t test-frontend .
docker build -f Dockerfile-Server -t test-backend .
docker build -f Dockerfile-Admin -t test-admin .
```

## Deployment

### Automated Deployment

**Triggers**:

- Push to `main` branch (Production)
- Push to `develop` branch (Staging)

**Process**:

1. All tests pass
2. Docker images built and pushed
3. Deploy to target environment
4. Health checks performed
5. Notifications sent

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production

# Docker deployment
./scripts/deploy.sh docker

# Rollback
./scripts/deploy.sh rollback
```

## Monitoring and Notifications

### Success/Failure Notifications

- **Slack**: Build status and deployment updates
- **Email**: Critical failures only

### Coverage Reports

- **Codecov**: Automatic coverage reporting
- **GitHub**: PR coverage comments

### Security

- **CodeQL**: Static analysis security scanning
- **npm audit**: Dependency vulnerability scanning
- **SBOM**: Software Bill of Materials generation

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify pnpm lock file is up to date
   - Ensure all environment variables are set

2. **Test Failures**
   - MongoDB connection issues
   - Environment variable misconfigurations
   - Test data conflicts

3. **Docker Build Issues**
   - Dockerfile syntax errors
   - Missing dependencies
   - Context path problems

### Debug Commands

```bash
# Local test run
npm run test

# Local build test
npm run build

# Docker build test
docker-compose config
docker-compose build

# Lint check
npm run lint
```

## Performance Optimizations

### Caching

- **pnpm store**: Cached across builds
- **node_modules**: Cached when lock file unchanged
- **Docker layers**: Multi-stage build optimization

### Parallel Execution

- Matrix builds run in parallel
- Build stages execute concurrently where possible
- Multi-platform testing

### Resource Management

- Build timeouts configured
- Concurrent job limits set
- Artifact retention policies

## Security Best Practices

1. **Secrets Management**
   - All sensitive data in encrypted secrets
   - No hardcoded credentials
   - Environment-specific configurations

2. **Dependency Security**
   - Regular security audits
   - Automated vulnerability scanning
   - SBOM generation for compliance

3. **Container Security**
   - Non-root users in Docker images
   - Minimal base images (Alpine)
   - Regular base image updates

## Maintenance

### Weekly Tasks

- Review dependency update PRs
- Check security scan results
- Monitor build performance

### Monthly Tasks

- Update CI/CD configurations
- Review and update secrets
- Performance optimization review

### Quarterly Tasks

- Platform version updates
- Security policy review
- Disaster recovery testing
