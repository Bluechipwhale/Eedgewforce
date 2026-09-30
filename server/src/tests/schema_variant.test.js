import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSchemaVariant } from '../config/schemaVariant.js';

test('the application defaults to the same schema as all SQL entry points', () => {
  assert.equal(resolveSchemaVariant(undefined), 'numbered');
  assert.equal(resolveSchemaVariant(''), 'numbered');
  assert.equal(resolveSchemaVariant('numbered'), 'numbered');
  assert.equal(resolveSchemaVariant('legacy'), 'legacy');
  assert.throws(() => resolveSchemaVariant('typo'), /SUPABASE_SCHEMA_VARIANT/);
});
