import assert from 'assert';
import {
  generateToolOutputSubscriptionToken,
  parsePublishedToolOutputToken,
  secureCompareText,
} from 'doggy-nav-core';

describe('tool output publication token helpers', () => {
  it('generates opaque subscription tokens', () => {
    const first = generateToolOutputSubscriptionToken();
    const second = generateToolOutputSubscriptionToken();

    assert.ok(first.length >= 24);
    assert.ok(second.length >= 24);
    assert.notStrictEqual(first, second);
  });

  it('parses subscription tokens from query values', () => {
    assert.strictEqual(parsePublishedToolOutputToken(' token-value '), 'token-value');
    assert.strictEqual(parsePublishedToolOutputToken(''), null);
    assert.strictEqual(parsePublishedToolOutputToken(undefined), null);
  });

  it('compares tokens without accepting mismatched values', () => {
    assert.strictEqual(secureCompareText('abc123', 'abc123'), true);
    assert.strictEqual(secureCompareText('abc123', 'abc124'), false);
    assert.strictEqual(secureCompareText('abc123', ''), false);
  });
});
