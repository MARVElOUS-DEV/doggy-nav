# Doggy Nav Deployment Guide

## Architecture Overview

This project consists of three main components:

- **Frontend**: `doggy-nav-main` (Next.js app)
- **Backend**: `doggy-nav-server` (Egg.js API server)
- **Admin Panel**: `doggy-nav-admin` (UmiJS app)

## Vercel Deployment (Frontend Only)

### Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy your backend server separately (see Backend Deployment section)

### Steps

1. **Connect to Vercel**:

   ```bash
   vercel login
   ```

2. **Deploy from the main project directory**:

   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project settings in Vercel Dashboard
   - Add these environment variables:
     - `SERVER_URL`: Your deployed backend URL (e.g., `https://your-backend.railway.app`)
     - `ANALYZE`: `false`

### Alternative: Deploy specific package

```bash
cd packages/doggy-nav-main
vercel --prod
```

## Backend Deployment Options

Since Vercel is primarily for frontend/serverless, deploy your backend separately:

### Option 1: Railway

1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Select `packages/doggy-nav-server` as source
4. Set environment variables:
   - `JWT_SECRET`: Strong random secret
   - `MONGO_URL`: MongoDB connection string
   - `NODE_ENV`: `production`
   - `PORT`: `3002`

### Option 2: DigitalOcean App Platform

1. Create account at [digitalocean.com](https://digitalocean.com)
2. Use App Platform to deploy from GitHub
3. Point to `packages/doggy-nav-server`
4. Configure environment variables

### Option 3: Heroku

```bash
cd packages/doggy-nav-server
heroku create your-app-name
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGO_URL=your-mongodb-url
heroku config:set NODE_ENV=production
git subtree push --prefix packages/doggy-nav-server heroku main
```

## Admin Panel Deployment

For the admin panel (`doggy-nav-admin`):

1. Build: `cd packages/doggy-nav-admin && pnpm build`
2. Deploy to any static hosting (Netlify, Vercel, etc.)

## Cloudflare Pages (Admin)

The admin app is a SPA (Umi/Ant Design) and can be deployed on Cloudflare Pages with Pages Functions handling the API proxy and secret headers.

### What’s already set up in the repo

- SPA fallback: `packages/doggy-nav-admin/public/_redirects` (routes `/*` → `/index.html`)
- API proxy function: `packages/doggy-nav-admin/functions/api/[[path]].ts`
  - Proxies `/api/*` to `${DOGGY_SERVER}/api/*`
  - Injects `x-client-secret` from `DOGGY_SERVER_CLIENT_SECRET`
  - Sets forwarding headers (`X-Real-IP`, `X-Forwarded-*`) similar to `deploy/nginx-admin.conf`

No wrangler config is required in the admin package; we reuse wrangler from the workers package.

### Deploy via GitHub Actions (manual)

1. Set repo secrets (GitHub → Settings → Secrets and variables → Actions):
   - `CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_PAGES_PROJECT_NAME`
   - Optional secrets for runtime: `DOGGY_SERVER`, `DOGGY_SERVER_CLIENT_SECRET`
2. Run workflow: “Deploy Admin to Cloudflare Pages (Manual)” and choose environment (`production` or `preview`).
   - The workflow builds `packages/doggy-nav-admin/dist` and deploys with:
     `pnpm -F doggy-nav-workers exec wrangler pages deploy dist --project-name <project> --branch <branch> --cwd packages/doggy-nav-admin`
   - If provided, the workflow also pushes secrets with:
     `wrangler pages secret put <NAME> --project-name <project> --environment <production|preview> --cwd packages/doggy-nav-admin`

### Required environment for Pages Functions

- `DOGGY_SERVER`: backend origin (e.g. `https://api.example.com`)
- `DOGGY_SERVER_CLIENT_SECRET`: value used for the `x-client-secret` request header to upstream

These should be created as Pages Project Secrets in the Cloudflare dashboard or via the workflow’s “secret put” step.

### Local check (optional)

```bash
pnpm -F doggy-nav-admin build
pnpm -F doggy-nav-workers exec wrangler pages dev dist --cwd packages/doggy-nav-admin
```

This serves the built SPA with the local Pages Functions.

## Environment Variables Reference

### Frontend (Vercel)

- `SERVER_URL`: Backend server URL
- `ANALYZE`: Bundle analyzer flag

### Backend (Your server platform)

- `JWT_SECRET`: JWT signing secret
- `MONGO_URL`: MongoDB connection string
- `NODE_ENV`: `production`
- `PORT`: Server port (default: 3002)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## Build Commands

### Frontend Only

```bash
pnpm web:build
```

### Full Project

```bash
pnpm build
```

## Troubleshooting

1. **Build fails**: Ensure all dependencies are installed with `pnpm install`
2. **API calls fail**: Verify `SERVER_URL` environment variable is set correctly
3. **Database connection**: Ensure MongoDB is accessible from your backend deployment
