#!/bin/bash

# Deployment Script for Doggy Nav
# Supports multiple deployment targets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

# Configuration
DEPLOYMENT_TYPE=${1:-"staging"}
BUILD_DIR="./build"
# Registry settings (align with compose files)
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"ghcr.io"}
IMAGE_NAMESPACE=${IMAGE_NAMESPACE:-"MARVElOUS-DEV"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Detect compose command (docker compose preferred)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  print_error "Docker Compose not found (need docker compose or docker-compose)"
  exit 1
fi

print_header "Starting deployment for: $DEPLOYMENT_TYPE"

# Validate environment
validate_environment() {
    print_status "Validating deployment environment..."

    if [[ -z "$DEPLOYMENT_TYPE" ]]; then
        print_error "Deployment type not specified"
        exit 1
    fi

    case $DEPLOYMENT_TYPE in
        "staging"|"production"|"docker")
            print_status "✅ Valid deployment type: $DEPLOYMENT_TYPE"
            ;;
        *)
            print_error "Invalid deployment type: $DEPLOYMENT_TYPE"
            print_status "Valid options: staging, production, docker"
            exit 1
            ;;
    esac
}

# Local build helper (only for docker mode)
build_local_images() {
    print_status "Building Docker images locally..."
    bash scripts/docker-build.sh
}

# Deploy to staging
deploy_staging() {
    print_header "Deploying to staging environment"

    # Pull and start Compose stack (local or remote)

    # Deploy to staging server
    print_status "Deploying to staging server..."

    # Example deployment commands (customize for your infrastructure)
    if [[ -n "$STAGING_SERVER" ]]; then
        # Using docker-compose on remote server
        print_status "Deploying via docker-compose to $STAGING_SERVER"

        # Ensure remote directory exists
        ssh $STAGING_SERVER 'mkdir -p /opt/doggy-nav'

        # Copy compose and env files (compose uses registry images)
        scp deploy/docker-compose-prod.yml $STAGING_SERVER:/opt/doggy-nav/docker-compose.yml
        if [[ -f deploy/.env ]]; then
          scp deploy/.env $STAGING_SERVER:/opt/doggy-nav/.env
        else
          scp deploy/.env.example $STAGING_SERVER:/opt/doggy-nav/.env.example
        fi

        # Deploy on remote server
        ssh $STAGING_SERVER << 'EOF'
            set -e
            cd /opt/doggy-nav
            if command -v docker compose >/dev/null 2>&1; then C="docker compose"; else C="docker-compose"; fi
            # Use provided .env or fallback to example
            if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env; fi
            $C pull
            $C up -d
            $C ps
            # Initialize categories (idempotent)
            set +e
            $C exec -T server node utils/initCategories.js || true
EOF
    else
        print_warning "STAGING_SERVER not configured, running locally"
        $COMPOSE_CMD pull || true
        $COMPOSE_CMD up -d
        # Initialize categories locally (idempotent)
        set +e
        $COMPOSE_CMD exec -T server node utils/initCategories.js || print_warning "Category init skipped or already done"
        set -e
    fi

    print_status "✅ Staging deployment completed"
}

# Deploy to production
deploy_production() {
    print_header "Deploying to production environment"

    if [[ -z "$PRODUCTION_SERVER" ]]; then
        print_error "PRODUCTION_SERVER environment variable not set"
        exit 1
    fi

    print_status "Deploying to production server: $PRODUCTION_SERVER"

    # Create deployment script for remote execution
    cat > deploy-remote.sh << EOF
#!/bin/bash
cd /opt/doggy-nav
set -e
export IMAGE_TAG="$IMAGE_TAG"
export IMAGE_REGISTRY="$DOCKER_REGISTRY"
export IMAGE_NAMESPACE="$IMAGE_NAMESPACE"

if command -v docker compose >/dev/null 2>&1; then C="docker compose"; else C="docker-compose"; fi

# Ensure compose and env files exist
if [ ! -f docker-compose.yml ]; then
  echo "docker-compose.yml not found" >&2
  exit 1
fi
if [ ! -f .env ] && [ -f .env.example ]; then cp .env.example .env; fi

# Pull and roll out
\$C pull
\$C up -d
\$C ps
docker system prune -f || true

# Initialize categories (idempotent)
set +e
\$C exec -T server node utils/initCategories.js || true
set -e

echo "Production deployment completed successfully"
EOF

    # Copy and execute deployment script
    # Ensure remote dir and base files
    ssh $PRODUCTION_SERVER 'mkdir -p /opt/doggy-nav'
    scp deploy/docker-compose-prod.yml $PRODUCTION_SERVER:/opt/doggy-nav/docker-compose.yml
    if [[ -f deploy/.env ]]; then
      scp deploy/.env $PRODUCTION_SERVER:/opt/doggy-nav/.env
    else
      scp deploy/.env.example $PRODUCTION_SERVER:/opt/doggy-nav/.env.example
    fi

    scp deploy-remote.sh $PRODUCTION_SERVER:/tmp/
    ssh $PRODUCTION_SERVER "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

    # Cleanup
    rm deploy-remote.sh

    print_status "✅ Production deployment completed"
}

# Deploy using Docker
deploy_docker() {
    print_header "Docker deployment"

    # Build images via compose (uses Dockerfiles in repo)
    print_status "Building and starting stack via compose..."

    # Start services
    print_status "Starting Docker services..."
    cp .env.docker.example .env
    $COMPOSE_CMD -f deploy/docker-compose-init-prod.yml up -d --build

    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30

    # Health check
    print_status "Performing health checks..."

    # Check frontend
    if curl -f http://localhost:3001 >/dev/null 2>&1; then
        print_status "✅ Frontend is healthy"
    else
        print_error "❌ Frontend health check failed"
    fi

    # Check backend
    if curl -f http://localhost:3002/api/health >/dev/null 2>&1; then
        print_status "✅ Backend is healthy"
    else
        print_warning "⚠️ Backend health check failed (might not have health endpoint)"
    fi

    # Check admin
    if curl -f http://localhost:8080 >/dev/null 2>&1; then
        print_status "✅ Admin panel is healthy"
    else
        print_error "❌ Admin panel health check failed"
    fi

    # Initialize categories locally (idempotent)
    set +e
    $COMPOSE_CMD -f deploy/docker-compose-init-prod.yml exec -T server node utils/initCategories.js || print_warning "Category init skipped or already done"
    set -e

    print_status "✅ Docker deployment completed"
    print_status "Access URLs:"
    print_status "  Frontend: http://localhost:3001"
    print_status "  Backend:  http://localhost:3002"
    print_status "  Admin:    http://localhost:8080"
}

# Rollback function
rollback() {
    print_header "Rolling back deployment"

    if [[ -n "$PREVIOUS_IMAGE_TAG" ]]; then
        print_status "Rolling back to: $PREVIOUS_IMAGE_TAG"
        # Implement rollback logic here
    else
        print_error "No previous version to rollback to"
        exit 1
    fi
}

# Main deployment flow
main() {
    validate_environment

    case $DEPLOYMENT_TYPE in
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        "docker")
            deploy_docker
            ;;
        "rollback")
            rollback
            ;;
    esac

    print_header "🎉 Deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "-h"|"--help")
        echo "Usage: $0 [staging|production|docker|rollback]"
        echo ""
        echo "Environment variables:"
        echo "  STAGING_SERVER    - Staging server hostname"
        echo "  PRODUCTION_SERVER - Production server hostname"
        echo "  DOCKER_REGISTRY   - Docker registry URL (default: ghcr.io)"
        echo "  IMAGE_NAMESPACE   - Registry namespace (default: MARVElOUS-DEV)"
        echo "  IMAGE_TAG         - Docker image tag (default: latest)"
        exit 0
        ;;
    *)
        main
        ;;
esac