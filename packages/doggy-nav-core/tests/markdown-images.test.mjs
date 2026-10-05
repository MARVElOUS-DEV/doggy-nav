import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getMarkdownImageUrl,
  normalizeImageServiceUrl,
  resolveMarkdownImageUrl,
} from '../dist/utils/markdown-images.js';

const oldHost = 'https://old-images.example';
const currentHost = 'https://images.example';
const path = '/images/user-1/example_com_20261005000000_photo_png';
const image = { key: path.slice(1), url: `${oldHost}${path}` };

test('stores the storage key and renders it against whichever host is configured', () => {
  const stored = getMarkdownImageUrl(image, `${currentHost}/`);
  assert.equal(stored, path);
  assert.equal(resolveMarkdownImageUrl(stored, currentHost), `${currentHost}${path}`);
  assert.equal(
    resolveMarkdownImageUrl(stored, 'https://next.example'),
    `https://next.example${path}`
  );
});

test('extracts storage paths from any previous host without a configured legacy list', () => {
  for (const host of [
    oldHost,
    currentHost,
    'https://another-old.example',
    'http://local.example:8788',
  ]) {
    assert.equal(
      resolveMarkdownImageUrl(`${host}${path}`, 'https://next.example'),
      `https://next.example${path}`
    );
    assert.equal(getMarkdownImageUrl({ url: `${host}${path}` }, currentHost), path);
  }
  assert.equal(
    resolveMarkdownImageUrl(`//old-images.example${path}`, currentHost),
    `${currentHost}${path}`
  );
});

test('preserves URL suffixes and supports service bases with a path prefix', () => {
  const base = 'https://media.example/assets';
  assert.equal(
    resolveMarkdownImageUrl(`${oldHost}${path}?width=300#preview`, base),
    `${base}${path}?width=300#preview`
  );
  assert.equal(resolveMarkdownImageUrl(`${base}${path}`, base), `${base}${path}`);
  assert.equal(getMarkdownImageUrl({ url: `${base}${path}` }, base), path);
});

test('leaves external images and non-image paths untouched', () => {
  for (const src of [
    'https://external.example/photo.png',
    `${oldHost}/logo.png`,
    '/assets/logo.png',
    'photo.png',
    '/images/user-1/../secret',
    '/images/user-1/%2e%2e',
    '/images/user-1/%2fsecret',
    '/images/user-1/%zz',
    `https://user:password@old-images.example${path}`,
    `ftp://old-images.example${path}`,
  ])
    assert.equal(resolveMarkdownImageUrl(src, currentHost), src);
});

test('retains existing behavior when no valid image service is configured', () => {
  for (const base of [
    '',
    'not-a-url',
    'javascript:alert(1)',
    'https://user:pass@media.example',
    'https://media.example?query=1',
  ]) {
    assert.equal(normalizeImageServiceUrl(base), '');
    assert.equal(getMarkdownImageUrl(image, base), image.url);
    assert.equal(resolveMarkdownImageUrl(image.url, base), image.url);
  }
  assert.equal(normalizeImageServiceUrl(` ${currentHost}/// `), currentHost);
  assert.equal(
    getMarkdownImageUrl(
      { key: '../secret', url: 'https://external.example/photo.png' },
      currentHost
    ),
    'https://external.example/photo.png'
  );
});
