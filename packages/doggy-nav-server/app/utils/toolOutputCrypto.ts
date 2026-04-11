import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

function resolveEncryptionKey(secret: string): Buffer {
  const normalized = String(secret || '').trim();
  if (!normalized || normalized.length < 32) {
    throw new Error('JWT_SECRET is missing or too short');
  }
  return createHash('sha256').update(normalized).digest();
}

export function encryptToolOutput(plaintext: string, secret: string) {
  const key = resolveEncryptionKey(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encryptedOutput: encrypted.toString('base64'),
    encryptionIv: iv.toString('base64'),
    encryptionTag: tag.toString('base64'),
  };
}

export function decryptToolOutput(
  payload: {
    encryptedOutput: string;
    encryptionIv: string;
    encryptionTag: string;
  },
  secret: string
) {
  const key = resolveEncryptionKey(secret);
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(payload.encryptionIv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.encryptionTag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.encryptedOutput, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
