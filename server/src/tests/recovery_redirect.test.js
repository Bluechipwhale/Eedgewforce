import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryRedirectUrl } from '../services/supabaseAuthService.js';

test('password recovery returns to the requesting EdgeWForce origin', () => {
  assert.equal(recoveryRedirectUrl('http://127.0.0.1:5174'), 'http://127.0.0.1:5174/');
  assert.equal(recoveryRedirectUrl('https://edgewforce.example'), 'https://edgewforce.example/');
  assert.notEqual(recoveryRedirectUrl('https://edgewforce.example/path'), 'https://edgewforce.example/');
});
