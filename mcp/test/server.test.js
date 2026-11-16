import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';

async function fixture(t, authenticated = true) {
  const calls = [];
  let fail = false;
  const query = new Proxy({}, {
    get(_, method) {
      if (method === 'then') return (resolve) => resolve({ data: [{ id: 1 }], error: fail ? new Error('secret upstream details') : null });
      return (...args) => { calls.push([method, ...args]); return query; };
    },
  });
  const server = createServer({
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'user-a' } : null }, error: null }) },
    from: (...args) => { calls.push(['from', ...args]); return query; },
  });
  const client = new Client({ name: 'test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  t.after(async () => { await client.close(); await server.close(); });
  return { client, calls, fail: () => { fail = true; } };
}

test('discovers tools and enforces owner filters on reads and mutations', async t => {
  const { client, calls } = await fixture(t);
  assert.equal((await client.listTools()).tools.length, 5);
  for (const [name, args] of [
    ['list_applications', {}], ['get_application', { id: 1 }],
    ['update_application', { id: 1, updates: { status: 'offer' } }],
    ['delete_application', { id: 1, confirm: true }],
  ]) {
    calls.length = 0;
    assert.equal((await client.callTool({ name, arguments: args })).isError, false);
    assert.ok(calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-a'));
  }
});

test('creation binds ownership; validation blocks unsafe updates and deletes', async t => {
  const { client, calls } = await fixture(t);
  const response = await client.callTool({ name: 'create_application', arguments: {
    job_title: 'Engineer', company_name: 'Example', job_link: '', company_link: '', status: 'applied', date_applied: '2026-11-12T12:00:00Z',
  } });
  assert.equal(response.isError, false);
  assert.equal(calls.find(call => call[0] === 'insert')[1].user_id, 'user-a');
  for (const args of [{}, { user_id: 'other' }, { status: 'invalid' }]) {
    calls.length = 0;
    assert.equal((await client.callTool({ name: 'update_application', arguments: { id: 1, updates: args } })).isError, true);
    assert.equal(calls.length, 0);
  }
  assert.equal((await client.callTool({ name: 'delete_application', arguments: { id: 1 } })).isError, true);
  assert.equal((await client.callTool({ name: 'list_applications', arguments: { limit: 101 } })).isError, true);
});

test('authentication failure prevents database access', async t => {
  const { client, calls } = await fixture(t, false);
  assert.equal((await client.callTool({ name: 'list_applications', arguments: {} })).isError, true);
  assert.equal(calls.length, 0);
});

test('upstream errors are reported without leaking details', async t => {
  const { client, fail } = await fixture(t);
  fail();
  const response = await client.callTool({ name: 'get_application', arguments: { id: 1 } });
  assert.equal(response.isError, true);
  assert.doesNotMatch(JSON.stringify(response), /secret upstream/);
});
