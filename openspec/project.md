# Project Context

## Purpose

Doggy Nav is a self‑hosted navigation and bookmark management system for teams and individuals. It organizes links into categories/tags, supports search and favorites, provides analytics, and offers multi‑user access with RBAC and i18n (English/Chinese).

## Tech Stack

- Monorepo: pnpm workspaces (packages/\*)
- Frontend (packages/doggy-nav-main): Next.js 15, React 18, TypeScript, Tailwind CSS v4, i18next, Jotai, axios, dnd-kit, framer-motion, Lucide icons, Recharts, Three.js. Next output: standalone, distDir: dist, i18n locales: en/zh.
- Backend (packages/doggy-nav-server): Egg.js (Node.js) with TypeScript, Mongoose (MongoDB), JWT (egg-jwt), CORS (egg-cors), rate limiting, cron, Passport (GitHub/Google/LinuxDo) for OAuth.
- Admin (packages/doggy-nav-admin): Umi Max 4, Ant Design 5, Pro Components (ProTable/ProForm), Webpack.
- Tooling: TypeScript across repo, ESLint (per package), Prettier, Husky, lint-staged, Commitizen (conventional commits).

## Project Conventions

### Code Style

- Formatting: Prettier (printWidth 100, singleQuote, trailingComma es5, semi; 2-space indent).
- Linting: Next/TypeScript rules in web, Umi rules in admin, Egg rules in server; build outputs ignored.
- Naming: React components/classes in PascalCase; helpers camelCase; routes/files kebab-case (see AGENTS.md).
- Styling (doggy-nav-main): Prefer Tailwind tokens and the design-system (src/styles/design-system.ts). Avoid hardcoded colors; keep existing gradients.
- Package install: pnpm --filter <package> i <name> [-D]; do not use npm install directly (see CLAUDE.md).

### Architecture Patterns

- Monorepo layout: packages/doggy-nav-main (web), packages/doggy-nav-server (api), packages/doggy-nav-admin (admin). Shared scripts in /scripts, deployment in /deploy, docs in /docs.
- Web (Next.js): pages/ routing, Tailwind v4 with CSS variable based theme, i18n via i18next, state via Jotai, HTTP via axios. Env: SERVER_URL for API. Images allowlisted to img.alicdn.com.
- API (Egg.js): REST endpoints with JWT auth, Mongoose models, CORS/rate limiting, scheduled jobs; configuration via .env.\* and scripts/validate-secrets.js.
- Admin (Umi): Ant Design/Pro components; dev proxy via DOGGY_SERVER; optional x-client-secret header when REQUIRE_CLIENT_SECRET=true.
- Ports (local): web 3001, server 3002, admin defaults to 3000 (README notes 8080 for some setups).

### Testing Strategy

- Server: egg-bin test/cov; tests under packages/doggy-nav-server/test; run with pnpm --filter doggy-nav-server run test.
- Web/Admin: No test commands defined yet; add per package when introducing tests.

### Git Workflow

- Default branch: main (remote). Active development branch in repo: dev. Use feature/\* branches; keep PRs small and focused.
- Commits: Conventional Commits via pnpm commit (Commitizen).
- Pre-commit: Husky + lint-staged formats MD/JSON/YAML with Prettier and runs per-package lint:fix.

## Domain Context

- Entities: Users, Bookmarks, Categories, Tags, Favorites; views/analytics; RBAC for permissions; multi-language UI.
- Primary user journeys: browse/search bookmarks, manage collections/categories, authenticate, and share within teams.

## Important Constraints

- Node >= 20.17.0; use pnpm workspaces.
- doggy-nav-main must use Tailwind/design-system tokens; avoid hardcoded colors (gradients allowed).
- Environment-driven config (.env.local/.env); never commit secrets; secrets validated by scripts/validate-secrets.js.
- Local ports: 3001 (web), 3002 (server). MongoDB required.

## External Dependencies

- Database: MongoDB (>= 7.0).
- OAuth Providers: GitHub, Google, LinuxDo (optional; set client IDs/secrets and callbacks).
- Hosting: Frontend can deploy to Vercel (vercel.json present). Docker files provided for all services.
- CI/CD: GitHub Actions pipeline (see README badges and docs/CI-CD.md).
