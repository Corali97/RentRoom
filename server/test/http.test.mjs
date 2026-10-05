import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server.mjs';

test('API rejects unsafe requests, verifies database health and sanitizes errors', async t => {
  let connectionCount = 0;
  let fail = false;
  const queries = [];
  const pool = {
    async getConnection() {
      connectionCount++;
      if (fail) throw Object.assign(new Error('secret password=do-not-expose'), { code: 'NJS-TEST' });
      return {
        async execute(sql) { queries.push(sql); return { rows: [{ READY: 1 }] }; },
        async rollback() {}, async close() {}
      };
    }
  };
  const logs = [];
  const app = await startServer({ port: 0, pool, env: {}, logger: { error: (...values) => logs.push(values) } });
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.port}`;
  const health = await fetch(`${base}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok', database: 'oracle' });
  assert.deepEqual(queries, ['SELECT 1 AS READY FROM DUAL']);
  assert.equal(health.headers.get('access-control-allow-origin'), null);
  assert.equal(health.headers.get('cache-control'), 'no-store');

  const count = connectionCount;
  for (const origin of [undefined, 'https://attacker.example']) {
    const res = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: '{}' });
    assert.equal(res.status, 403);
  }
  assert.equal(connectionCount, count);

  const headers = { Origin: 'http://localhost:4200', 'Content-Type': 'application/json' };
  const malformed = await fetch(`${base}/api/auth/register`, { method: 'POST', headers, body: '{' });
  assert.equal(malformed.status, 400);
  const tooLarge = await fetch(`${base}/api/auth/register`, { method: 'POST', headers, body: JSON.stringify({ value: 'x'.repeat(65536) }) });
  assert.equal(tooLarge.status, 413);
  const wrongType = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { Origin: 'http://localhost:4200' }, body: '{}' });
  assert.equal(wrongType.status, 415);
  const invalid = await fetch(`${base}/api/auth/register`, { method: 'POST', headers, body: '[]' });
  assert.equal(invalid.status, 400);
  assert.equal(connectionCount, count);

  fail = true;
  const failure = await fetch(`${base}/api/health`);
  assert.equal(failure.status, 503);
  const message = await failure.text();
  assert.equal(message.includes('secret'), false);
  assert.equal(message.includes('password'), false);
  assert.deepEqual(logs, [['Solicitud API fallida:', 'NJS-TEST']]);
});
