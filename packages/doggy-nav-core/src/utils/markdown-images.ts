export function normalizeImageServiceUrl(value: string): string {
  try {
    const url = new URL(value.trim());
    if (
      !['https:', 'http:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return '';
    return url.href.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function isImagePath(path: string): boolean {
  const parts = path.split('/');
  if (parts.length !== 4 || parts[0] !== '' || parts[1] !== 'images') return false;
  return parts.slice(2).every((part) => {
    try {
      const decoded = decodeURIComponent(part);
      return /^[a-zA-Z0-9_.-]+$/.test(decoded) && decoded !== '.' && decoded !== '..';
    } catch {
      return false;
    }
  });
}

function getImagePath(src: string, serviceUrl: string): string | undefined {
  if (src.startsWith('/images/') && isImagePath(src.split(/[?#]/, 1)[0])) return src;
  try {
    const url = new URL(src.startsWith('//') ? `${new URL(serviceUrl).protocol}${src}` : src);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      return undefined;
    const prefix = new URL(serviceUrl).pathname.replace(/\/+$/, '');
    const path =
      prefix && url.pathname.startsWith(`${prefix}/`)
        ? url.pathname.slice(prefix.length)
        : url.pathname;
    return isImagePath(path) ? `${path}${url.search}${url.hash}` : undefined;
  } catch {
    return undefined;
  }
}

/** Persist the object key, retaining absolute URLs for deployments without an image host. */
export function getMarkdownImageUrl(
  image: { key?: string; url: string },
  imageServiceUrl: string
): string {
  const base = normalizeImageServiceUrl(imageServiceUrl);
  if (!base) return image.url;
  const path = image.key ? `/${image.key}` : undefined;
  if (path && isImagePath(path)) return path;
  return getImagePath(image.url, base) || image.url;
}

/** Uploaded image paths use the configured host, regardless of the stored URL's origin. */
export function resolveMarkdownImageUrl(src: string, imageServiceUrl: string): string {
  const base = normalizeImageServiceUrl(imageServiceUrl);
  if (!base) return src;
  const path = getImagePath(src, base);
  return path ? `${base}${path}` : src;
}
