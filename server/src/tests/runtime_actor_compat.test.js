import test from 'node:test';
import assert from 'node:assert/strict';
import { retryLegacyRuntimeActorWrite } from '../config/runtimeActorCompat.js';

const uuid = '11111111-1111-4111-8111-111111111111';
const lookup = {
  from(table) {
    assert.equal(table, 'users');
    return { select(column) {
      assert.equal(column, 'id');
      return { eq(key, value) {
        assert.equal(key, 'uuid');
        assert.equal(value, uuid);
        return { maybeSingle: async () => ({ data: { id: 11 }, error: null }) };
      } };
    } };
  }
};

test('retries only known runtime actor columns on a legacy bigint type error', async () => {
  const original = { title: 'Task', acknowledged_by: uuid, completed_by: uuid };
  let attempts = 0;
  const result = await retryLegacyRuntimeActorWrite('tasks', original,
    { code: '22P02', message: 'invalid input syntax for type bigint' }, lookup,
    async record => { attempts++; return { data: record, error: null }; });
  assert.equal(attempts, 1);
  assert.deepEqual(result.data, { title: 'Task', acknowledged_by: 11, completed_by: 11 });
  assert.equal(original.acknowledged_by, uuid);
  assert.equal(await retryLegacyRuntimeActorWrite('tasks', original,
    { code: '23503', message: 'foreign key violation' }, lookup, async () => { throw new Error('No retry'); }), null);
});
