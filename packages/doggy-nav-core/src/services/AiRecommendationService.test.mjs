import assert from 'node:assert/strict';
import {
  buildSimilarNavRecommendationMessages,
  normalizeSimilarNavRecommendationInput,
  parseSimilarNavRecommendations,
} from '../../dist/services/AiRecommendationService.js';
import { AiService } from '../../dist/services/AiService.js';

const parsed = parseSimilarNavRecommendations(
  '{"headline":"Better tools","summary":"Picked from the live web.","recommendations":[{"name":"Better","url":"https://better.example","description":"A focused tool","reason":"Faster workflows","bestFor":"Teams","match":120},{"name":"Duplicate","url":"https://www.better.example/other","description":"Duplicate host","reason":"No","bestFor":"Nobody","match":90}]}',
  'https://source.example'
);

assert.deepEqual(parsed, {
  headline: 'Better tools',
  summary: 'Picked from the live web.',
  recommendations: [
    {
      name: 'Better',
      url: 'https://better.example',
      description: 'A focused tool',
      reason: 'Faster workflows',
      bestFor: 'Teams',
      match: 99,
    },
  ],
});
assert.match(
  buildSimilarNavRecommendationMessages({ name: 'Source', url: 'https://source.example' })[1]
    .content,
  /"sourceWebsite"/
);
assert.deepEqual(
  normalizeSimilarNavRecommendationInput({
    source: { name: 'Source', url: 'https://source.example' },
    candidates: [{ id: 'ignored' }],
  }),
  { source: { name: 'Source', url: 'https://source.example' } }
);

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (_url, { signal }) => {
  fetchCalls += 1;
  return new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    });
  });
};
try {
  await assert.rejects(
    new AiService({
      apiKey: 'test',
      baseURL: 'https://ai.example',
      model: 'test',
    }).chatCompletions(
      { messages: [{ role: 'user', content: 'test' }] },
      { timeoutMs: 5, maxRetries: 0 }
    ),
    { name: 'AbortError' }
  );
  assert.equal(fetchCalls, 1);
} finally {
  globalThis.fetch = originalFetch;
}
