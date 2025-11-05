export function newId24(): string {
  // 24-char hex (Mongo-like ObjectId). Use crypto if available, fallback to Math.random.
  const bytes = new Uint8Array(12);
  const cryptoObj = (globalThis as any).crypto;
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, '0');
    hex += h;
  }
  return hex;
}
