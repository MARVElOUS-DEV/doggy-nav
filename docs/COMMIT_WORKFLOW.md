# Git Commit Workflow

This project uses an improved git commit workflow with automatic linting and conventional commits.

## Features

✅ **Pre-commit hooks** - Automatic linting and formatting before commits
✅ **Conventional commits** - Standardized commit message format
✅ **Multi-package linting** - Lint checks for all subpackages
✅ **Auto-formatting** - Prettier formatting for JSON, MD, YAML files

## How to Commit

### Method 1: Interactive Conventional Commit (Recommended)

```bash
pnpm commit
```

This will:

1. Run pre-commit hooks (lint + format)
2. Open an interactive prompt for conventional commit messages
3. Guide you through type, scope, description, etc.

### Method 2: Regular Git Commit

```bash
git add .
git commit -m "feat: add new feature"
```

This will still run pre-commit hooks but you write the message manually.

## Pre-commit Hooks

The following checks run automatically before each commit:

- **TypeScript/JavaScript files**: ESLint with auto-fix
  - `packages/doggy-nav-server/**/*.{ts,js}`
  - `packages/doggy-nav-main/**/*.{ts,tsx,js,jsx}`
  - `packages/doggy-nav-admin/**/*.{ts,tsx,js,jsx}`
- **Config files**: Prettier formatting
  - `**/*.{json,md,yml,yaml}`

## Conventional Commit Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Manual Commands

```bash
# Run linting on all packages
pnpm lint

# Fix linting issues on all packages
pnpm lint:fix

# Format files with prettier
prettier --write "**/*.{json,md,yml,yaml}"

# Test pre-commit hooks manually
npx lint-staged
```

## Configuration Files

- `.husky/pre-commit` - Pre-commit hook configuration
- `package.json` - lint-staged and commitizen configuration
- `.prettierrc` - Prettier formatting rules
- Individual package ESLint configurations
