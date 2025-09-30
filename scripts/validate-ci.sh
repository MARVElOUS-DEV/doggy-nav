#!/bin/bash

# CI/CD Configuration Validation Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_header() { echo -e "${BLUE}[INFO]${NC} $1"; }

# Validation functions
validate_github_actions() {
    print_header "Validating GitHub Actions workflows..."

    # Check if workflow files exist
    local workflows=(".github/workflows/ci.yml" ".github/workflows/docker-publish.yml" ".github/workflows/dependency-update.yml")

    for workflow in "${workflows[@]}"; do
        if [[ -f "$workflow" ]]; then
            print_status "Found workflow: $workflow"

            # Validate YAML syntax
            if command -v yamllint >/dev/null 2>&1; then
                if yamllint "$workflow" >/dev/null 2>&1; then
                    print_status "YAML syntax valid: $workflow"
                else
                    print_error "YAML syntax invalid: $workflow"
                fi
            else
                print_warning "yamllint not installed, skipping YAML validation"
            fi
        else
            print_error "Missing workflow: $workflow"
        fi
    done
}

validate_travis_ci() {
    print_header "Validating Travis CI configuration..."

    if [[ -f ".travis.yml" ]]; then
        print_status "Found .travis.yml"

        # Check for required sections
        local required_sections=("language" "node_js" "install" "script")
        for section in "${required_sections[@]}"; do
            if grep -q "^$section:" .travis.yml; then
                print_status "Found required section: $section"
            else
                print_error "Missing required section: $section"
            fi
        done

        # Validate YAML syntax
        if command -v yamllint >/dev/null 2>&1; then
            if yamllint .travis.yml >/dev/null 2>&1; then
                print_status "Travis YAML syntax valid"
            else
                print_error "Travis YAML syntax invalid"
            fi
        fi
    else
        print_error "Missing .travis.yml"
    fi
}

validate_appveyor() {
    print_header "Validating AppVeyor configuration..."

    if [[ -f "appveyor.yml" ]]; then
        print_status "Found appveyor.yml"

        # Check for required sections
        local required_sections=("environment" "install" "test_script")
        for section in "${required_sections[@]}"; do
            if grep -q "^$section:" appveyor.yml; then
                print_status "Found required section: $section"
            else
                print_error "Missing required section: $section"
            fi
        done

        # Validate YAML syntax
        if command -v yamllint >/dev/null 2>&1; then
            if yamllint appveyor.yml >/dev/null 2>&1; then
                print_status "AppVeyor YAML syntax valid"
            else
                print_error "AppVeyor YAML syntax invalid"
            fi
        fi
    else
        print_error "Missing appveyor.yml"
    fi
}

validate_docker_files() {
    print_header "Validating Docker configurations..."

    local dockerfiles=("Dockerfile-Main" "Dockerfile-Server" "Dockerfile-Admin")
    for dockerfile in "${dockerfiles[@]}"; do
        if [[ -f "$dockerfile" ]]; then
            print_status "Found Dockerfile: $dockerfile"

            # Check for multi-stage build
            if grep -q "FROM.*AS" "$dockerfile"; then
                print_status "Multi-stage build detected: $dockerfile"
            else
                print_warning "No multi-stage build: $dockerfile"
            fi

            # Check for non-root user
            if grep -q "USER" "$dockerfile"; then
                print_status "Non-root user configured: $dockerfile"
            else
                print_warning "No non-root user configured: $dockerfile"
            fi
        else
            print_error "Missing Dockerfile: $dockerfile"
        fi
    done

    # Check docker-compose files
    if [[ -f "docker-compose.yml" ]]; then
        print_status "Found docker-compose.yml"

        # Validate docker-compose syntax
        if command -v docker-compose >/dev/null 2>&1; then
            if docker-compose config >/dev/null 2>&1; then
                print_status "docker-compose.yml syntax valid"
            else
                print_error "docker-compose.yml syntax invalid"
            fi
        fi
    fi
}

validate_package_scripts() {
    print_header "Validating package.json scripts..."

    local required_scripts=("test" "build" "lint")

    # Check root package.json
    if [[ -f "package.json" ]]; then
        for script in "${required_scripts[@]}"; do
            if jq -e ".scripts.\"$script\"" package.json >/dev/null 2>&1; then
                print_status "Found script in root: $script"
            else
                print_warning "Missing script in root: $script"
            fi
        done
    fi

    # Check package scripts
    local packages=("packages/doggy-nav-main" "packages/doggy-nav-server" "packages/doggy-nav-admin")
    for package in "${packages[@]}"; do
        if [[ -f "$package/package.json" ]]; then
            print_status "Checking package: $package"

            for script in "${required_scripts[@]}"; do
                if jq -e ".scripts.\"$script\"" "$package/package.json" >/dev/null 2>&1; then
                    print_status "Found script in $package: $script"
                else
                    print_warning "Missing script in $package: $script"
                fi
            done
        fi
    done
}

validate_environment_files() {
    print_header "Validating environment configuration files..."

    local env_files=(".env.docker.example" ".env.vercel.example")
    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            print_status "Found environment file: $env_file"
        else
            print_warning "Missing environment file: $env_file"
        fi
    done
}

validate_dependencies() {
    print_header "Validating project dependencies..."

    # Check if pnpm is available
    if command -v pnpm >/dev/null 2>&1; then
        print_status "pnpm is available"

        # Check if lock file exists
        if [[ -f "pnpm-lock.yaml" ]]; then
            print_status "pnpm-lock.yaml exists"
        else
            print_error "pnpm-lock.yaml missing"
        fi
    else
        print_error "pnpm not available"
    fi

    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        print_status "Node.js version: $node_version"

        # Check if version is >= 20
        local major_version=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
        if [[ $major_version -ge 20 ]]; then
            print_status "Node.js version is compatible"
        else
            print_warning "Node.js version might be too old (recommended: >= 20)"
        fi
    else
        print_error "Node.js not available"
    fi
}

run_basic_tests() {
    print_header "Running basic validation tests..."

    # Test if dependencies can be installed
    if command -v pnpm >/dev/null 2>&1; then
        print_status "Testing dependency installation..."
        if pnpm install --frozen-lockfile >/dev/null 2>&1; then
            print_status "Dependencies install successfully"
        else
            print_error "Dependency installation failed"
        fi

        # Test if project builds
        print_status "Testing project build..."
        if pnpm build >/dev/null 2>&1; then
            print_status "Project builds successfully"
        else
            print_error "Project build failed"
        fi
    fi
}

# Main validation function
main() {
    print_header "🔍 CI/CD Configuration Validation Starting..."
    echo ""

    validate_github_actions
    echo ""

    validate_travis_ci
    echo ""

    validate_appveyor
    echo ""

    validate_docker_files
    echo ""

    validate_package_scripts
    echo ""

    validate_environment_files
    echo ""

    validate_dependencies
    echo ""

    if [[ "${1:-}" != "--skip-tests" ]]; then
        run_basic_tests
        echo ""
    fi

    print_header "✅ CI/CD Validation completed!"
    print_header "📋 Summary:"
    print_status "All CI/CD configurations have been validated"
    print_status "Check the output above for any warnings or errors"
    print_status "Run with --skip-tests to skip installation/build tests"
}

# Handle arguments
case "${1:-}" in
    "-h"|"--help")
        echo "Usage: $0 [--skip-tests]"
        echo ""
        echo "Validates CI/CD configuration files and dependencies"
        echo ""
        echo "Options:"
        echo "  --skip-tests    Skip dependency installation and build tests"
        echo "  -h, --help      Show this help message"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac