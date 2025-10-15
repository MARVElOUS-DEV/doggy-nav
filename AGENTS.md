# Repository Guidelines

## Project Structure & Module Organization

- pnpm workspaces power three core apps under `packages/`: `doggy-nav-main` (Next.js client with feature code in `src/` and routing in `pages/`), `doggy-nav-admin` (Umi/Ant Design admin console in `src/`), and `doggy-nav-server` (Egg.js API with runtime code in `app/` and tests in `test/`).
- Shared resources live at the root: deployment recipes in `deploy/`, documentation in `docs/`, and helper utilities in `scripts/`. Keep `pnpm-workspace.yaml` and the top-level TypeScript configs in sync when introducing new packages.

## Build, Test & Development Commands

- Bootstrap the workspace with `pnpm install` (Node >= 20.17.0). Add new dependencies with `pnpm --filter <package> i <name> [-D]` to keep scopes clean.
- Use `pnpm web:dev`, `pnpm admin:dev`, and `pnpm server:dev` for local development; each forwards to the respective package’s `dev` script.
- Root quality gates: `pnpm lint`, `pnpm lint:fix`, `pnpm test`, and `pnpm build`.

## Coding Style & Naming Conventions

- Prettier enforces 2-space indentation, 100-character lines, single quotes, and trailing commas; leave ESLint rules in place unless you document an exception.
- In `doggy-nav-main`, favor Tailwind tokens and design-system utilities over custom CSS; only preserve the gradients already defined.
- Name React components and classes in PascalCase, helper functions in camelCase, and route or file identifiers in kebab-case.

## Testing Guidelines

- Backend coverage relies on `egg-bin` and Mocha. Place specs under `packages/doggy-nav-server/test/` and run them with `pnpm --filter doggy-nav-server run test` or `run cov`.
- Client and admin tests reside in their respective `tests/` folders. Mirror feature names (`nav-menu.test.tsx`, `bookmarks.spec.ts`) and expose a `test` script you execute before submitting.
- Treat failing or skipped tests as blockers and note any gaps or follow-up tickets in the PR description.

## Commit & Pull Request Guidelines

- Use conventional commits through `pnpm commit` (Commitizen). Include the package scope when possible (e.g., `fix(server): handle expired token`).
- For PRs, confirm lint, tests, and builds succeed, summarize the change set, link issues, and attach screenshots or API samples when behavior shifts. Call out required environment or schema updates explicitly.

## Environment & Tooling Notes

- Secrets are checked by `scripts/validate-secrets.js`; mirror new variables in `.env.example`. Run `pnpm prepare` after cloning to enable Husky hooks and keep ports `3001` (web) and `3002` (server) free locally.
