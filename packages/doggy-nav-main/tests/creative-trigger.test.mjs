import assert from 'node:assert/strict';
import {
  isCreativeTriggerGestureComplete,
  normalizeCreativeTriggerVariant,
} from '../src/creativeTrigger.ts';

assert.equal(normalizeCreativeTriggerVariant('paper-plane'), 'paper-plane');
assert.equal(normalizeCreativeTriggerVariant('invalid'), 'lightbulb-rope');
assert.equal(isCreativeTriggerGestureComplete('lightbulb-rope', { x: 0, y: 100 }), true);
assert.equal(isCreativeTriggerGestureComplete('lightbulb-rope', { x: 0, y: 99 }), false);
assert.equal(isCreativeTriggerGestureComplete('paper-plane', { x: -80, y: 80 }), true);
assert.equal(isCreativeTriggerGestureComplete('paper-plane', { x: -79, y: 80 }), false);
assert.equal(isCreativeTriggerGestureComplete('portal-slider', { x: 113, y: 0 }), true);
assert.equal(isCreativeTriggerGestureComplete('portal-slider', { x: 112, y: 0 }), false);
