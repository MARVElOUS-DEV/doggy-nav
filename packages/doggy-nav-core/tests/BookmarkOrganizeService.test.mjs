import assert from 'node:assert/strict';
import {
  BOOKMARK_ORGANIZE_MAX_ITEMS,
  BOOKMARK_ORGANIZE_PROMPT_CODE,
  normalizeBookmarkOrganizeRequest,
  organizeBookmarksWithAi,
  validateBookmarkOrganizeResponse,
} from '../dist/services/BookmarkOrganizeService.js';

const request = normalizeBookmarkOrganizeRequest({
  instruction: ' Separate work and personal ',
  bookmarks: [
    { id: 'b-work', title: 'Issue tracker', url: 'https://work.example/issues/42' },
    { id: 'b-home', title: 'Recipes', url: 'https://food.example/recipes' },
    { id: 'b-root', title: 'Search', url: 'https://search.example/?q=full-url' },
  ],
  tree: [
    {
      id: 'old-work',
      title: 'Old work',
      children: ['b-work', { id: 'remove-me', title: 'Old', children: ['b-root'] }],
    },
    'b-home',
  ],
});
assert.ok(request);
assert.equal(request.instruction, 'Separate work and personal');
assert.equal(BOOKMARK_ORGANIZE_PROMPT_CODE, 'bookmark.organize.v2');

const reorganized = {
  tree: [
    'b-root',
    {
      id: 'ai-folder-personal',
      title: 'Personal',
      children: ['b-home', { id: 'old-work', title: 'Projects', children: ['b-work'] }],
    },
  ],
};
assert.deepEqual(validateBookmarkOrganizeResponse(reorganized, request), {
  value: reorganized,
  errors: [],
});

for (const [name, response, errorPattern] of [
  ['missing', { tree: ['b-work', 'b-home'] }, /b-root is missing/],
  ['duplicate', { tree: ['b-work', 'b-home', 'b-root', 'b-root'] }, /appears 2 times/],
  ['invented', { tree: ['b-work', 'b-home', 'b-root', 'not-real'] }, /unknown bookmark/],
  [
    'invalid new folder ID',
    {
      tree: [
        {
          id: 'made-up-folder',
          title: 'No prefix',
          children: ['b-work', 'b-home', 'b-root'],
        },
      ],
    },
    /invalid new folder ID/,
  ],
  [
    'duplicate folder ID',
    {
      tree: [
        { id: 'old-work', title: 'One', children: ['b-work'] },
        { id: 'old-work', title: 'Two', children: ['b-home', 'b-root'] },
      ],
    },
    /invalid or duplicate folder/,
  ],
]) {
  const result = validateBookmarkOrganizeResponse(response, request);
  assert.equal(result.value, null, name);
  assert.match(result.errors.join('\n'), errorPattern, name);
}

function completion(content) {
  return {
    choices: [{ message: { role: 'assistant', content } }],
  };
}

const oneCallAi = {
  calls: [],
  async chatCompletions(payload) {
    this.calls.push(payload);
    return completion(JSON.stringify(reorganized));
  },
};
assert.deepEqual(await organizeBookmarksWithAi(oneCallAi, request), reorganized);
assert.equal(oneCallAi.calls.length, 1);
assert.match(oneCallAi.calls[0].messages[1].content, /https:\/\/work\.example\/issues\/42/);

const repairedAi = {
  calls: [],
  async chatCompletions(payload) {
    this.calls.push(payload);
    return this.calls.length === 1
      ? completion('{not json')
      : completion(JSON.stringify(reorganized));
  },
};
assert.deepEqual(await organizeBookmarksWithAi(repairedAi, request), reorganized);
assert.equal(repairedAi.calls.length, 2);
assert.match(repairedAi.calls[1].messages[1].content, /validationErrors/);
assert.match(repairedAi.calls[1].messages[1].content, /not valid JSON/);

const failedRepairAi = {
  calls: 0,
  async chatCompletions() {
    this.calls += 1;
    return completion(this.calls === 1 ? '{bad' : JSON.stringify({ tree: ['b-work'] }));
  },
};
assert.equal(await organizeBookmarksWithAi(failedRepairAi, request), null);
assert.equal(failedRepairAi.calls, 2);

const atLimit = Array.from({ length: BOOKMARK_ORGANIZE_MAX_ITEMS }, (_, index) => ({
  id: `b-${index}`,
  title: `Bookmark ${index}`,
  url: `https://example.com/${index}`,
}));
assert.ok(
  normalizeBookmarkOrganizeRequest({
    bookmarks: atLimit,
    tree: atLimit.map((bookmark) => bookmark.id),
  })
);
const overLimit = [...atLimit, { id: 'b-over', title: 'Over', url: 'https://example.com/over' }];
assert.equal(
  normalizeBookmarkOrganizeRequest({
    bookmarks: overLimit,
    tree: overLimit.map((bookmark) => bookmark.id),
  }),
  null
);
assert.equal(
  normalizeBookmarkOrganizeRequest({
    bookmarks: atLimit,
    tree: [{ id: 'folder-at-limit', title: 'Folder', children: atLimit.map(({ id }) => id) }],
  }),
  null
);
