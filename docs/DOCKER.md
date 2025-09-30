# Docker Deployment Guide

## Quick Start

1. **Copy environment variables**:
   ```bash
   cp .env.docker.example .env
   ```

2. **Start all services**:
   ```bash
   docker-compose up -d
   ```

3. **Access the applications**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3002
   - Admin Panel: http://localhost:8080
   - MongoDB: localhost:27017

## Development Setup

1. **Start only database services**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Run applications locally**:
   ```bash
   # Terminal 1: Backend
   pnpm server:dev

   # Terminal 2: Frontend
   pnpm web:dev

   # Terminal 3: Admin
   pnpm admin:dev
   ```

## Production Deployment

### Environment Configuration

Edit `.env` file with production values:
```bash
MONGO_ROOT_PASSWORD=your-secure-password
JWT_SECRET=your-super-secure-jwt-secret
```

### Build and Deploy

```bash
# Build all images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Individual Service Commands

### Backend Server
```bash
# Build
docker build -f Dockerfile-Server -t doggy-nav-server .

# Run
docker run -d \
  --name doggy-nav-server \
  -p 3002:3002 \
  -e MONGO_URL=mongodb://localhost:27017/doggy_nav \
  -e JWT_SECRET=your-secret \
  doggy-nav-server
```

### Frontend
```bash
# Build
docker build -f Dockerfile-Main -t doggy-nav-frontend .

# Run
docker run -d \
  --name doggy-nav-frontend \
  -p 3001:3001 \
  -e SERVER_URL=http://localhost:3002 \
  doggy-nav-frontend
```

### Admin Panel
```bash
# Build
docker build -f Dockerfile-Admin -t doggy-nav-admin .

# Run
docker run -d \
  --name doggy-nav-admin \
  -p 8080:8080 \
  -e DOGGY_SERVER=http://localhost:3002 \
  doggy-nav-admin
```

## Optimization Features

### Multi-stage Builds
- **Frontend**: Base → Dependencies → Builder → Runner (optimized for Next.js standalone)
- **Backend**: Base → Dependencies → Builder → Runner (production-only dependencies)
- **Admin**: Base → Dependencies → Builder → Nginx Runner

### Security
- Non-root users in all containers
- Minimal Alpine-based images
- Production-only dependencies
- Health checks for all services

### Performance
- Layer caching optimization
- Standalone Next.js output
- gzip compression in nginx
- Optimized build contexts with .dockerignore

## Monitoring and Health Checks

All services include health checks:
- **MongoDB**: Connection ping
- **Backend**: HTTP health endpoint
- **Frontend**: HTTP availability check
- **Admin**: HTTP availability check

View health status:
```bash
docker-compose ps
```

## Troubleshooting

### Build Issues
```bash
# Clear build cache
docker builder prune

# Rebuild without cache
docker-compose build --no-cache
```

### Runtime Issues
```bash
# View logs
docker-compose logs [service-name]

# Enter container
docker-compose exec [service-name] sh

# Restart service
docker-compose restart [service-name]
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## Port Mapping

| Service  | Internal Port | External Port |
|----------|---------------|---------------|
| Frontend | 3001          | 3001          |
| Backend  | 3002          | 3002          |
| Admin    | 8080          | 8080          |
| MongoDB  | 27017         | 27017         |

## Volume Management

```bash
# List volumes
docker volume ls

# Remove all volumes (⚠️ Data loss)
docker-compose down -v

# Backup database
docker exec doggy-nav-mongodb mongodump --out /backup
```