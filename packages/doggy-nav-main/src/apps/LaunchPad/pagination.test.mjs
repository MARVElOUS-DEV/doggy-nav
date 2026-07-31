import assert from 'node:assert/strict';
import { buildLaunchpadPages } from './pagination.ts';

const apps = [{ key: 'settings' }, { key: 'news' }];
const favorites = [{ kind: 'item', id: 'favorite' }];
const pages = buildLaunchpadPages(apps, favorites, 2);

assert.deepEqual(pages, [
  [
    { kind: 'app', app: apps[0] },
    { kind: 'app', app: apps[1] },
  ],
  [favorites[0]],
]);
assert.deepEqual(buildLaunchpadPages([], [], 24), [[]]);
