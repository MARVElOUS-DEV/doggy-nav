export interface ImageStorageClient {
  upload(key: string, data: ArrayBuffer, contentType: string): Promise<string>;
  getUsedBytes(userId: string): Promise<number>;
}

export interface UploadedImage {
  url: string;
  key: string;
  size: number;
}

export interface ImageUploadResult {
  success: boolean;
  images?: UploadedImage[];
  error?: string;
}

export interface ImageUploadConfig {
  maxFileSizeBytes: number;
  maxFilesPerRequest: number;
  userQuotaBytes: number;
  allowedMimeTypes: string[];
}

const DEFAULT_CONFIG: ImageUploadConfig = {
  maxFileSizeBytes: 3 * 1024 * 1024, // 3MB
  maxFilesPerRequest: 3,
  userQuotaBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
  ],
};

export class ImageUploadService {
  constructor(
    private readonly storage: ImageStorageClient,
    private readonly config: Partial<ImageUploadConfig> = {}
  ) {}

  private get cfg(): ImageUploadConfig {
    return { ...DEFAULT_CONFIG, ...this.config };
  }

  validateFile(file: { size: number; type: string }): string | null {
    if (!this.cfg.allowedMimeTypes.includes(file.type)) {
      return `Invalid file type: ${file.type}`;
    }
    if (file.size > this.cfg.maxFileSizeBytes) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds ${this.cfg.maxFileSizeBytes / 1024 / 1024}MB limit`;
    }
    return null;
  }

  validateBatch(files: { size: number; type: string }[]): string | null {
    if (files.length > this.cfg.maxFilesPerRequest) {
      return `Too many files: ${files.length} exceeds limit of ${this.cfg.maxFilesPerRequest}`;
    }
    for (const f of files) {
      const err = this.validateFile(f);
      if (err) return err;
    }
    return null;
  }

  async checkQuota(userId: string, incomingBytes: number, isAdmin: boolean): Promise<string | null> {
    if (isAdmin) return null;
    const used = await this.storage.getUsedBytes(userId);
    if (used + incomingBytes > this.cfg.userQuotaBytes) {
      const remaining = Math.max(0, this.cfg.userQuotaBytes - used);
      return `Quota exceeded: ${(remaining / 1024 / 1024).toFixed(2)}MB remaining`;
    }
    return null;
  }

  generateKey(userId: string, hostname: string, originalName: string): string {
    const now = new Date();
    const datetime = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const sanitized = originalName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const safeHost = hostname.replace(/[^a-zA-Z0-9-]/g, '_');
    return `images/${userId}/${safeHost}_${datetime}_${sanitized}`;
  }

  async upload(
    userId: string,
    hostname: string,
    isAdmin: boolean,
    files: { name: string; type: string; size: number; data: ArrayBuffer }[]
  ): Promise<ImageUploadResult> {
    const batchErr = this.validateBatch(files);
    if (batchErr) return { success: false, error: batchErr };

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    const quotaErr = await this.checkQuota(userId, totalSize, isAdmin);
    if (quotaErr) return { success: false, error: quotaErr };

    const uploaded: UploadedImage[] = [];
    for (const file of files) {
      const key = this.generateKey(userId, hostname, file.name);
      const url = await this.storage.upload(key, file.data, file.type);
      uploaded.push({ url, key, size: file.size });
    }
    return { success: true, images: uploaded };
  }
}
