import {
  getMarkdownImageUrl,
  resolveMarkdownImageUrl,
} from 'doggy-nav-core/dist/utils/markdown-images.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicEnv } from '../src/utils/publicEnv.ts';

test('uses the admin runtime image host ahead of the build environment', () => {
  const previousWindow = globalThis.window;
  const previousEnv = process.env.UMI_APP_IMAGE_SERVICE_URL;
  try {
    process.env.UMI_APP_IMAGE_SERVICE_URL = 'https://build.example';
    globalThis.window = {};
    assert.equal(
      getPublicEnv('UMI_APP_IMAGE_SERVICE_URL'),
      'https://build.example',
    );
    globalThis.window = {
      __DOGGY_NAV_RUNTIME_CONFIG__: {
        UMI_APP_IMAGE_SERVICE_URL: '"https://images.example/"',
      },
    };
    const image = {
      key: 'images/user-1/photo_png',
      url: 'https://old-images.example/images/user-1/photo_png',
    };
    const host = getPublicEnv('UMI_APP_IMAGE_SERVICE_URL');
    assert.equal(getMarkdownImageUrl(image, host), '/images/user-1/photo_png');
    assert.equal(
      resolveMarkdownImageUrl(image.url, host),
      'https://images.example/images/user-1/photo_png',
    );
    window.__DOGGY_NAV_RUNTIME_CONFIG__.UMI_APP_IMAGE_SERVICE_URL =
      'https://next.example';
    assert.equal(
      resolveMarkdownImageUrl(
        '/images/user-1/photo_png',
        getPublicEnv('UMI_APP_IMAGE_SERVICE_URL'),
      ),
      'https://next.example/images/user-1/photo_png',
    );
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousEnv === undefined) delete process.env.UMI_APP_IMAGE_SERVICE_URL;
    else process.env.UMI_APP_IMAGE_SERVICE_URL = previousEnv;
  }
});
