import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';
import { isAllowedBrowserOrigin } from '../utils/corsOrigin.js';

test('CORS accepts same-origin deployments and configured frontends only', () => {
  const configured = ['https://portal.example.com'];
  assert.equal(isAllowedBrowserOrigin('https://app.example.com', 'app.example.com', configured, true), true);
  assert.equal(isAllowedBrowserOrigin('https://portal.example.com', 'api.example.com', configured, true), true);
  assert.equal(isAllowedBrowserOrigin('https://untrusted.example', 'api.example.com', configured, true), false);
  assert.equal(isAllowedBrowserOrigin('null', 'api.example.com', configured, true), false);
  assert.equal(isAllowedBrowserOrigin('http://localhost:9000', 'api.example.com', configured, false), true);
  assert.equal(isAllowedBrowserOrigin('http://localhost:9000', 'api.example.com', configured, true), false);
});

test('login preflight permits its own host and rejects foreign origins without a 500', async () => {
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const host = `127.0.0.1:${server.address().port}`;
    const preflight = origin => fetch(`http://${host}/api/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    });
    const accepted = await preflight(`http://${host}`);
    assert.equal(accepted.status, 204);
    assert.equal(accepted.headers.get('access-control-allow-origin'), `http://${host}`);
    const rejected = await preflight('https://untrusted.example');
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).error.code, 'CORS_ORIGIN_DENIED');

    const badLogin = await fetch(`http://${host}/api/auth/login`, {
      method: 'POST',
      headers: { Origin: `http://${host}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-a-user@example.invalid', password: 'incorrect' })
    });
    assert.equal(badLogin.status, 400);
    assert.equal((await badLogin.json()).error.code, 'AUTH_FAILED');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
