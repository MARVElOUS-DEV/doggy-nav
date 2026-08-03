import assert from 'node:assert/strict';
import { getAiDiscoveryFailure } from '../src/utils/aiDiscoveryError.ts';

assert.equal(getAiDiscoveryFailure({ code: 401 }), 'auth');
assert.equal(getAiDiscoveryFailure({ code: 429 }), 'rate_limit');
assert.equal(getAiDiscoveryFailure({ code: 503 }), 'unavailable');
assert.equal(getAiDiscoveryFailure({ code: 0 }), 'network');
assert.equal(getAiDiscoveryFailure(new Error('Unexpected')), 'unknown');
