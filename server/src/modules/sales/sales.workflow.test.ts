import test from 'node:test';
import assert from 'node:assert/strict';
import { assertStatusTransition, normalizeStatus } from './sales.workflow';

test('normalizeStatus maps legacy values to canonical statuses', () => {
  assert.equal(normalizeStatus('converted'), 'won');
  assert.equal(normalizeStatus('final'), 'sent');
  assert.equal(normalizeStatus('confirmed'), 'confirmed');
  assert.equal(normalizeStatus('unknown'), 'draft');
});

test('assertStatusTransition accepts valid transitions', () => {
  assert.doesNotThrow(() => assertStatusTransition('draft', 'confirmed'));
  assert.doesNotThrow(() => assertStatusTransition('confirmed', 'sent'));
  assert.doesNotThrow(() => assertStatusTransition('sent', 'won'));
  assert.doesNotThrow(() => assertStatusTransition('sent', 'lost'));
});

test('assertStatusTransition rejects invalid transitions', () => {
  assert.throws(() => assertStatusTransition('draft', 'sent'));
  assert.throws(() => assertStatusTransition('won', 'lost'));
});
