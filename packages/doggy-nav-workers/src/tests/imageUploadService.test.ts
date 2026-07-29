import { ImageUploadService, type ImageStorageClient } from 'doggy-nav-core';

describe('ImageUploadService media validation', () => {
  const storage: ImageStorageClient = {
    upload: jest.fn(async (key) => `https://media.example/${key}`),
    getUsedBytes: jest.fn(async () => 0),
  };
  const service = new ImageUploadService(storage);
  const mb = 1024 * 1024;

  it.each([
    ['image/jpeg', 3 * mb],
    ['video/mp4', 10 * mb],
    ['video/webm', 10 * mb],
  ])('accepts %s at its limit and preserves metadata', async (type, size) => {
    const result = await service.upload('user-1', 'example.com', false, [
      { name: 'media.bin', type, size, data: new ArrayBuffer(0) },
    ]);

    expect(result.success).toBe(true);
    expect(result.images?.[0]).toMatchObject({
      url: expect.stringContaining('https://media.example/images/user-1/'),
      key: expect.stringContaining('images/user-1/'),
      size,
      type,
    });
  });

  it.each([
    ['image/png', 3 * mb + 1],
    ['video/mp4', 10 * mb + 1],
    ['video/webm', 10 * mb + 1],
    ['application/octet-stream', 1],
  ])('rejects invalid %s media', async (type, size) => {
    const result = await service.upload('user-1', 'example.com', false, [
      { name: 'media.bin', type, size, data: new ArrayBuffer(0) },
    ]);

    expect(result.success).toBe(false);
  });
});
