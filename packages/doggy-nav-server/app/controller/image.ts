import { Controller } from 'egg';
import { ImageUploadService } from 'doggy-nav-core';

export default class ImageController extends Controller {
  async upload() {
    const { ctx } = this;

    if (!ctx.state.user) {
      ctx.status = 401;
      ctx.body = { success: false, error: 'Authentication required' };
      return;
    }

    const storage = ctx.service.imageStorage;
    const publicUrl = this.app.config.IMAGES_PUBLIC_URL;
    if (!publicUrl) {
      ctx.status = 503;
      ctx.body = { success: false, error: 'Image storage not configured' };
      return;
    }

    const maxSizeMb = parseFloat(this.app.config.IMAGE_MAX_SIZE_MB || '3');
    const quotaMb = parseFloat(this.app.config.IMAGE_USER_QUOTA_MB || '50');
    const service = new ImageUploadService(storage, {
      maxFileSizeBytes: maxSizeMb * 1024 * 1024,
      userQuotaBytes: quotaMb * 1024 * 1024,
    });

    const parts = ctx.multipart();
    const files: { name: string; type: string; size: number; data: ArrayBuffer }[] = [];
    let part: any;

    while ((part = await parts()) != null) {
      if (part.length) continue; // field, skip
      const chunks: Buffer[] = [];
      for await (const chunk of part) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      files.push({
        name: part.filename,
        type: part.mimeType,
        size: buffer.length,
        data: new Uint8Array(buffer).buffer as ArrayBuffer,
      });
    }

    if (files.length === 0) {
      ctx.status = 400;
      ctx.body = { success: false, error: 'No files provided' };
      return;
    }

    const user = ctx.state.user;
    const isAdmin = user.roles?.includes('admin') || user.roles?.includes('sys_admin');
    const hostname = ctx.request.hostname;

    const result = await service.upload(user.id, hostname, isAdmin, files);

    if (!result.success) {
      ctx.status = 400;
      ctx.body = result;
      return;
    }

    ctx.body = { success: true, data: { images: result.images } };
  }
}
