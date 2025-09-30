#!/bin/bash

# Docker Build Script for Doggy Nav
set -e

echo "🐳 Building Doggy Nav Docker Images..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build images
build_image() {
    local dockerfile=$1
    local image_name=$2
    local context=${3:-"."}

    print_status "Building $image_name..."
    if docker build -f "$dockerfile" -t "$image_name" "$context"; then
        print_status "✅ Successfully built $image_name"
    else
        print_error "❌ Failed to build $image_name"
        exit 1
    fi
}

# Parse command line arguments
SERVICES=""
CACHE="--cache"

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            CACHE="--no-cache"
            shift
            ;;
        --service)
            SERVICES="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --no-cache    Build without using cache"
            echo "  --service     Build specific service (main|server|admin|all)"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set default service if none specified
if [ -z "$SERVICES" ]; then
    SERVICES="all"
fi

# Build based on service selection
if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "main" ]; then
    build_image "Dockerfile-Main" "doggy-nav-frontend:latest" "."
fi

if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "server" ]; then
    build_image "Dockerfile-Server" "doggy-nav-backend:latest" "."
fi

if [ "$SERVICES" = "all" ] || [ "$SERVICES" = "admin" ]; then
    build_image "Dockerfile-Admin" "doggy-nav-admin:latest" "."
fi

print_status "🎉 Build completed successfully!"

# Show image sizes
print_status "📊 Image sizes:"
docker images | grep "doggy-nav" | awk '{print $1":"$2"\t"$7$8}'

print_status "🚀 To start all services, run:"
echo "docker-compose up -d"