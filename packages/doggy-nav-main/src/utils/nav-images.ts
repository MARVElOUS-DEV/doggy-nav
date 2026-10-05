import {
  getMarkdownImageUrl,
  resolveMarkdownImageUrl,
} from 'doggy-nav-core/dist/utils/markdown-images.js';

export function getNavImageMarkdownUrl(image: { key?: string; url: string }) {
  return getMarkdownImageUrl(image, process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || '');
}

export function resolveNavImageUrl(src?: string) {
  return src ? resolveMarkdownImageUrl(src, process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL || '') : src;
}
