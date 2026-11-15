import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeUpload } from '../lib/upload-auth.ts';

const secret = 'test-only-secret-that-is-at-least-32-characters';
const request = (token) => new Request('https://example.test/api/releases', {
  method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {},
});
test('unconfigured production rejects uploads', async () => {
  assert.equal((await authorizeUpload(request(secret)))?.status, 503);
  assert.equal((await authorizeUpload(request(secret), 'short'))?.status, 503);
});
test('anonymous and incorrect credentials are rejected', async () => {
  assert.equal((await authorizeUpload(request(), secret))?.status, 401);
  assert.equal((await authorizeUpload(request(secret + 'x'), secret))?.status, 401);
});
test('only the configured credential authorizes uploads', async () => {
  assert.equal(await authorizeUpload(request(secret), secret), null);
});
