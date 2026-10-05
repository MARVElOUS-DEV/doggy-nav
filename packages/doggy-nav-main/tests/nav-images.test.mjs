import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import { getNavImageMarkdownUrl, resolveNavImageUrl } from '../src/utils/nav-images.ts';

test('renders uploaded and legacy Markdown images from the configured host', () => {
  const previous = process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL;
  try {
    process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL = 'https://images.example';
    const path = '/images/user-1/photo_png';
    const oldUrl = `https://old-images.example${path}`;
    assert.equal(getNavImageMarkdownUrl({ key: path.slice(1), url: oldUrl }), path);
    const html = renderToStaticMarkup(
      React.createElement(
        ReactMarkdown,
        {
          components: {
            img: ({ src, alt }) =>
              React.createElement('img', { src: resolveNavImageUrl(src), alt }),
          },
        },
        `![new](${path})\n\n![legacy][photo]\n\n[photo]: ${oldUrl} "Title"\n\n[link](${oldUrl})\n\n![external](https://external.example/photo.png)\n\n![unsafe](javascript:alert(1))`
      )
    );
    assert.equal(
      (html.match(/src="https:\/\/images\.example\/images\/user-1\/photo_png"/g) || []).length,
      2
    );
    assert.ok(html.includes(`href="${oldUrl}"`));
    assert.ok(html.includes('src="https://external.example/photo.png"'));
    assert.ok(!html.includes('javascript:'));
    process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL = 'https://next.example';
    assert.equal(resolveNavImageUrl(path), `https://next.example${path}`);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL;
    else process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL = previous;
  }
});
