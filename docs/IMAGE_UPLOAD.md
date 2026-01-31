# Image Upload Feature

This document describes the image upload feature for the Markdown editor in Doggy Nav.

## Overview

The image upload feature allows authenticated users to upload images directly from the Markdown editor. Images are stored in S3-compatible storage (Cloudflare R2 or MinIO) and can be embedded in markdown content.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (doggy-nav-main)                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  MarkdownEditor                                          │   │
│  │  - Toolbar button for image upload                       │   │
│  │  - Drag & drop support                                   │   │
│  │  - Paste from clipboard                                  │   │
│  │  - Auto-insert ![](url) on success                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│  doggy-nav-image-service │  │  doggy-nav-server        │
│  (Cloudflare Workers)    │  │  (Docker/Node)           │
│  - R2 storage            │  │  - S3-compatible storage │
│  - Standalone service    │  │  - MinIO / AWS S3        │
└──────────────────────────┘  └──────────────────────────┘
```

## Constraints

| Constraint            | Value                                    |
| --------------------- | ---------------------------------------- |
| Authentication        | Required (JWT)                           |
| Max file size         | 3MB per image                            |
| Max files per request | 3                                        |
| Allowed types         | jpeg, png, gif, webp, svg, avif          |
| User quota            | 50MB (unlimited for admins)              |
| Filename format       | `{hostname}_{datetime}_{sanitized_name}` |

## Deployment Options

### Option 1: Standalone Image Service (Recommended)

Deploy `doggy-nav-image-service` as a separate Cloudflare Worker with R2 storage. Works with both Docker and Workers backends.

```bash
cd packages/doggy-nav-image-service
pnpm deploy
```

Configure in frontend:

```env
NEXT_PUBLIC_IMAGE_SERVICE_URL=https://your-image-service.workers.dev
```

### Option 2: Integrated with Docker Backend

Use the built-in `/api/images/upload` endpoint in `doggy-nav-server` with S3-compatible storage (MinIO, AWS S3, or R2 via S3 API).

Configure in server:

```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=doggy-nav-images
IMAGES_PUBLIC_URL=http://localhost:9000/doggy-nav-images
```

## API Reference

### POST /upload (or /api/images/upload)

Upload images to storage.

**Request:**

- Headers: `Authorization: Bearer <jwt>`, `Content-Type: multipart/form-data`
- Body: `files` (multiple File objects)

**Response:**

```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://storage.example.com/images/user123/example_20240131120000_photo.jpg",
        "key": "images/user123/example_20240131120000_photo.jpg",
        "size": 123456
      }
    ]
  }
}
```

**Errors:**

- `401`: Authentication required / Invalid token
- `400`: Validation error (file type, size, count, quota)
- `503`: Storage not configured

## Frontend Usage

The `MarkdownEditor` component automatically includes image upload when `enableImageUpload={true}` (default).

```tsx
import MarkdownEditor from '@/components/MarkdownEditor';

<MarkdownEditor
  value={content}
  onChange={setContent}
  enableImageUpload={true} // default
  height={400}
/>;
```

Users can:

1. Click the image icon in the toolbar
2. Drag & drop images onto the editor
3. Paste images from clipboard (Ctrl/Cmd+V)

## Security

- JWT token is validated on every upload request
- File type is validated by MIME type
- File size is enforced server-side
- Per-user quota prevents abuse (admins exempt)
- Filenames are sanitized to prevent path traversal
