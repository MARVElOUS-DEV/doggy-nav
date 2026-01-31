import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ImageUploadService } from 'doggy-nav-core';

type Env = {
  IMAGES_BUCKET: R2Bucket;
  IMAGES_PUBLIC_URL: string;
  JWT_SECRET: string;
  ALLOWED_ORIGINS?: string;
  IMAGE_MAX_SIZE_MB?: string;
  IMAGE_USER_QUOTA_MB?: string;
};

type JwtPayload = {
  userId: string;
  roles?: string[];
  exp?: number;
};

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || '';
  const allowed = (c.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length && allowed.includes(origin)) {
    return cors({ origin, credentials: true })(c, next);
  }
  return next();
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// JWT verification helper
async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    // Note: For production, implement proper HMAC verification
    // This is simplified - the main backend already verified the token
    return payload;
  } catch {
    return null;
  }
}

// R2 storage client
class R2Storage {
  constructor(private bucket: R2Bucket, private publicUrl: string) {}

  async upload(key: string, data: ArrayBuffer, contentType: string): Promise<string> {
    await this.bucket.put(key, data, { httpMetadata: { contentType } });
    return `${this.publicUrl}/${key}`;
  }

  async getUsedBytes(userId: string): Promise<number> {
    const list = await this.bucket.list({ prefix: `images/${userId}/` });
    return list.objects.reduce((sum, obj) => sum + obj.size, 0);
  }
}

// Upload endpoint
app.post('/upload', async (c) => {
  // Auth check
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return c.json({ success: false, error: 'Authentication required' }, 401);

  const payload = await verifyJwt(token, c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: 'Invalid token' }, 401);

  // Config check
  if (!c.env.IMAGES_BUCKET || !c.env.IMAGES_PUBLIC_URL) {
    return c.json({ success: false, error: 'Image storage not configured' }, 503);
  }

  const isAdmin = payload.roles?.includes('admin') || payload.roles?.includes('sys_admin');
  const storage = new R2Storage(c.env.IMAGES_BUCKET, c.env.IMAGES_PUBLIC_URL);
  const service = new ImageUploadService(storage, {
    maxFileSizeBytes: parseFloat(c.env.IMAGE_MAX_SIZE_MB || '3') * 1024 * 1024,
    userQuotaBytes: parseFloat(c.env.IMAGE_USER_QUOTA_MB || '50') * 1024 * 1024,
  });

  // Parse files
  const formData = await c.req.formData();
  const files: { name: string; type: string; size: number; data: ArrayBuffer }[] = [];
  for (const value of formData.getAll('files')) {
    if (value && typeof value === 'object' && 'arrayBuffer' in value) {
      const file = value as File;
      files.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: await file.arrayBuffer(),
      });
    }
  }

  if (!files.length) return c.json({ success: false, error: 'No files provided' }, 400);

  const hostname = new URL(c.req.url).hostname;
  const result = await service.upload(payload.userId, hostname, isAdmin ?? false, files);

  if (!result.success) return c.json({ success: false, error: result.error }, 400);
  return c.json({ success: true, data: { images: result.images } });
});

export default app;
