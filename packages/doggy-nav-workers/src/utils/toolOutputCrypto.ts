const encoder = new TextEncoder();
const decoder = new TextDecoder();

function normalizeSecret(secret: string): string {
  const value = String(secret || '').trim();
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET is missing or too short');
  }
  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function resolveKey(secret: string): Promise<CryptoKey> {
  const normalized = normalizeSecret(secret);
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(normalized));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptToolOutput(plaintext: string, secret: string) {
  const key = await resolveKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv) },
      key,
      toArrayBuffer(encoder.encode(plaintext))
    )
  );
  const tagLength = 16;
  const ciphertext = encrypted.slice(0, encrypted.length - tagLength);
  const tag = encrypted.slice(encrypted.length - tagLength);

  return {
    encryptedOutput: bytesToBase64(ciphertext),
    encryptionIv: bytesToBase64(iv),
    encryptionTag: bytesToBase64(tag),
  };
}

export async function decryptToolOutput(
  payload: {
    encryptedOutput: string;
    encryptionIv: string;
    encryptionTag: string;
  },
  secret: string
) {
  const key = await resolveKey(secret);
  const ciphertext = base64ToBytes(payload.encryptedOutput);
  const tag = base64ToBytes(payload.encryptionTag);
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(payload.encryptionIv)) },
    key,
    toArrayBuffer(combined)
  );

  return decoder.decode(decrypted);
}
