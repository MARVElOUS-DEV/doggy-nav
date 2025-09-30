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