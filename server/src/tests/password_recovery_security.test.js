import test from 'node:test';
import assert from 'node:assert/strict';
import { authService } from '../services/authService.js';
import { db } from '../config/database.js';

test('password reset requires a valid, unexpired, single-use recovery token', async () => {
  db.resetToSeed();
  const email = 'hr@edgewforce.com';
  const user = await db.findOne('users', { email });
  const originalHash = user.password_hash;
  for (const token of [undefined, '', 'wrong-token']) {
    await assert.rejects(authService.resetPassword(email, token, 'SecureReplacement123!'), /Invalid or expired/);
  }
  assert.equal((await db.findById('users', user.id)).password_hash, originalHash);
  const recovery = await authService.forgotPassword(email);
  await db.update('users', user.id, { reset_token_expires_at: new Date(0).toISOString() });
  await assert.rejects(authService.resetPassword(email, recovery.reset_token, 'SecureReplacement123!'), /Invalid or expired/);
  const valid = await authService.forgotPassword(email);
  await authService.resetPassword(email, valid.reset_token, 'SecureReplacement123!');
  await assert.rejects(authService.resetPassword(email, valid.reset_token, 'AnotherReplacement123!'), /Invalid or expired/);
});
