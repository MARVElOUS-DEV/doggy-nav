import { Service } from 'egg';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import type { ImageStorageClient } from 'doggy-nav-core';

export default class ImageStorageService extends Service implements ImageStorageClient {
  private _client: S3Client | null = null;

  private get client(): S3Client {
    if (!this._client) {
      const { S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION } = this.app.config;
      this._client = new S3Client({
        endpoint: S3_ENDPOINT,
        region: S3_REGION || 'auto',
        credentials: {
          accessKeyId: S3_ACCESS_KEY_ID || '',
          secretAccessKey: S3_SECRET_ACCESS_KEY || '',
        },
      });
    }
    return this._client;
  }

  private get bucket(): string {
    return this.app.config.S3_BUCKET || 'doggy-nav-images';
  }

  private get publicUrl(): string {
    return this.app.config.IMAGES_PUBLIC_URL || '';
  }

  async upload(key: string, data: ArrayBuffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(data),
        ContentType: contentType,
      })
    );
    return `${this.publicUrl}/${key}`;
  }

  async getUsedBytes(userId: string): Promise<number> {
    const prefix = `images/${userId}/`;
    const result = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
    );
    return (result.Contents || []).reduce((sum, obj) => sum + (obj.Size || 0), 0);
  }
}
