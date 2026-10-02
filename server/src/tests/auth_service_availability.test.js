import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';
import { authService } from '../services/authService.js';
import { db } from '../config/database.js';
import { signUserToken } from '../middleware/auth.js';
import { isServiceUnavailable } from '../utils/serviceAvailability.js';

test('classifies network failures separately from rejected credentials', () => {
  assert.equal(isServiceUnavailable({ name: 'AuthRetryableFetchError', message: 'fetch failed' }), true);
  assert.equal(isServiceUnavailable({ status: 504, message: 'Gateway timeout' }), true);
  assert.equal(isServiceUnavailable(new Error('Invalid login credentials')), false);
});

test('transient auth and database failures do not invalidate a user session', async () => {
  db.resetToSeed();
  const account = await db.findOne('users', { email: 'hr@edgewforce.com' });
  const token = signUserToken(account);
  const originalLogin = authService.login;
  const originalMe = authService.me;
  const originalFindOne = db.findOne;
  const server = app.listen(0, '127.0.0.1');

  try {
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;

    authService.login = async () => { throw new Error('SUPABASE_TIMEOUT'); };
    const login = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'hr@edgewforce.com', password: 'not-a-real-password' })
    });
    assert.equal(login.status, 503);
    assert.equal((await login.json()).error.code, 'SERVICE_UNAVAILABLE');
    authService.login = originalLogin;

    db.findOne = async () => { throw new Error('SUPABASE_TIMEOUT'); };
    const notifications = await fetch(`${base}/notifications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(notifications.status, 503);
    assert.equal((await notifications.json()).error.code, 'SERVICE_UNAVAILABLE');
    db.findOne = originalFindOne;

    authService.me = async () => { throw new Error('SUPABASE_TIMEOUT'); };
    const me = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    assert.equal(me.status, 503);
    assert.equal((await me.json()).error.code, 'SERVICE_UNAVAILABLE');
  } finally {
    authService.login = originalLogin;
    authService.me = originalMe;
    db.findOne = originalFindOne;
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
