import {
  getMarkdownImageUrl,
  resolveMarkdownImageUrl,
} from 'doggy-nav-core/dist/utils/markdown-images.js';
import { getPublicEnv } from './publicEnv';

export function getNavImageMarkdownUrl(image: { key?: string; url: string }) {
  return getMarkdownImageUrl(image, getPublicEnv('UMI_APP_IMAGE_SERVICE_URL'));
}

export function resolveNavImageUrl(src?: string) {
  return src
    ? resolveMarkdownImageUrl(src, getPublicEnv('UMI_APP_IMAGE_SERVICE_URL'))
    : src;
}
