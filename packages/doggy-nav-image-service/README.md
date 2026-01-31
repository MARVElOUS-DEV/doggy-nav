# Doggy Nav Image Service

Standalone Cloudflare Workers service for image uploads using R2 storage. Can be used with both the Docker backend and the Workers backend.

## Features

- R2 object storage for images
- JWT authentication (shares secret with main backend)
- File validation (type, size, count)
- Per-user quota (50MB default, unlimited for admins)
- CORS support

## Setup

### 1. Create R2 Bucket

In Cloudflare Dashboard:

1. Go to R2 → Create bucket
2. Name it (e.g., `doggy-nav-images`)
3. Enable public access or set up a custom domain

### 2. Deploy the Worker

```bash
cd packages/doggy-nav-image-service
pnpm install
pnpm deploy
```

### 3. Configure Bindings

In Cloudflare Dashboard → Workers → doggy-nav-image-service → Settings:

**R2 Bucket Binding:**

- Variable name: `IMAGES_BUCKET`
- R2 bucket: your-bucket-name

**Environment Variables:**

- `JWT_SECRET`: Same as your main backend
- `IMAGES_PUBLIC_URL`: Your R2 public URL (e.g., `https://images.your-domain.com`)
- `ALLOWED_ORIGINS`: Comma-separated origins (e.g., `https://your-app.com,http://localhost:3001`)

**Optional:**

- `IMAGE_MAX_SIZE_MB`: Max file size (default: 3)
- `IMAGE_USER_QUOTA_MB`: Per-user quota (default: 50)

## API

### POST /upload

Upload images (max 3 per request).

**Headers:**

- `Authorization: Bearer <jwt-token>`
- `Content-Type: multipart/form-data`

**Body:**

- `files`: Image files (multiple allowed)

**Response:**

```json
{
  "success": true,
  "data": {
    "images": [{ "url": "https://...", "key": "images/user123/...", "size": 12345 }]
  }
}
```

### GET /health

Health check endpoint.

## Integration

### Frontend Configuration

Set the image service URL in your frontend:

```env
# .env.local
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://your-image-service.workers.dev
```

Update the upload hook to use this URL when configured.

### With Docker Backend

The Docker backend can proxy to this service, or the frontend can call it directly with the JWT token from the main auth flow.

### With Workers Backend

The Workers backend can either:

1. Use this as a separate service (recommended for isolation)
2. Import the R2 logic directly (if you prefer a monolithic deployment)
