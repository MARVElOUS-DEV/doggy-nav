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
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"ghcr.io"}
IMAGE_TAG=${GITHUB_SHA:-$(git rev-parse --short HEAD)}

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

# Build applications
build_applications() {
    print_status "Building applications..."

    # Install dependencies
    print_status "Installing dependencies..."
    pnpm install --frozen-lockfile

    # Build all packages
    print_status "Building all packages..."
    pnpm build

    print_status "✅ Build completed successfully"
}

# Deploy to staging
deploy_staging() {
    print_header "Deploying to staging environment"

    # Build Docker images
    print_status "Building Docker images..."
    docker-compose -f docker-compose.yml build

    # Deploy to staging server
    print_status "Deploying to staging server..."

    # Example deployment commands (customize for your infrastructure)
    if [[ -n "$STAGING_SERVER" ]]; then
        # Using docker-compose on remote server
        print_status "Deploying via docker-compose to $STAGING_SERVER"

        # Copy docker-compose files
        scp docker-compose.yml .env.docker.example $STAGING_SERVER:/opt/doggy-nav/

        # Deploy on remote server
        ssh $STAGING_SERVER << 'EOF'
            cd /opt/doggy-nav
            cp .env.docker.example .env
            docker-compose pull
            docker-compose up -d
            docker-compose ps
EOF
    else
        print_warning "STAGING_SERVER not configured, running locally"
        cp .env.docker.example .env
        docker-compose up -d
    fi

    print_status "✅ Staging deployment completed"
}

# Deploy to production
deploy_production() {
    print_header "Deploying to production environment"

    # Additional validation for production
    if [[ -z "$PRODUCTION_SERVER" ]]; then
        print_error "PRODUCTION_SERVER environment variable not set"
        exit 1
    fi

    # Build and tag Docker images for production
    print_status "Building production Docker images..."

    docker build -f Dockerfile-Main -t $DOCKER_REGISTRY/doggy-nav-frontend:$IMAGE_TAG .
    docker build -f Dockerfile-Server -t $DOCKER_REGISTRY/doggy-nav-backend:$IMAGE_TAG .
    docker build -f Dockerfile-Admin -t $DOCKER_REGISTRY/doggy-nav-admin:$IMAGE_TAG .

    # Push images to registry
    if [[ -n "$DOCKER_REGISTRY" ]]; then
        print_status "Pushing images to registry..."
        docker push $DOCKER_REGISTRY/doggy-nav-frontend:$IMAGE_TAG
        docker push $DOCKER_REGISTRY/doggy-nav-backend:$IMAGE_TAG
        docker push $DOCKER_REGISTRY/doggy-nav-admin:$IMAGE_TAG
    fi

    # Deploy to production server
    print_status "Deploying to production server: $PRODUCTION_SERVER"

    # Create deployment script for remote execution
    cat > deploy-remote.sh << EOF
#!/bin/bash
cd /opt/doggy-nav
export IMAGE_TAG=$IMAGE_TAG
export DOCKER_REGISTRY=$DOCKER_REGISTRY

# Pull latest images
docker pull \$DOCKER_REGISTRY/doggy-nav-frontend:\$IMAGE_TAG
docker pull \$DOCKER_REGISTRY/doggy-nav-backend:\$IMAGE_TAG
docker pull \$DOCKER_REGISTRY/doggy-nav-admin:\$IMAGE_TAG

# Update docker-compose with new image tags
sed -i "s|image: .*doggy-nav-frontend.*|image: \$DOCKER_REGISTRY/doggy-nav-frontend:\$IMAGE_TAG|g" docker-compose.yml
sed -i "s|image: .*doggy-nav-backend.*|image: \$DOCKER_REGISTRY/doggy-nav-backend:\$IMAGE_TAG|g" docker-compose.yml
sed -i "s|image: .*doggy-nav-admin.*|image: \$DOCKER_REGISTRY/doggy-nav-admin:\$IMAGE_TAG|g" docker-compose.yml

# Rolling update
docker-compose up -d
docker-compose ps
docker system prune -f

echo "Production deployment completed successfully"
EOF

    # Copy and execute deployment script
    scp deploy-remote.sh $PRODUCTION_SERVER:/tmp/
    ssh $PRODUCTION_SERVER "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh"

    # Cleanup
    rm deploy-remote.sh

    print_status "✅ Production deployment completed"
}

# Deploy using Docker
deploy_docker() {
    print_header "Docker deployment"

    # Build images
    print_status "Building Docker images..."
    bash scripts/docker-build.sh

    # Start services
    print_status "Starting Docker services..."
    cp .env.docker.example .env
    docker-compose up -d

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
    build_applications

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
        echo "  DOCKER_REGISTRY   - Docker registry URL"
        echo "  IMAGE_TAG         - Docker image tag (default: git SHA)"
        exit 0
        ;;
    *)
        main
        ;;
esac