import assert from 'node:assert/strict'
import { handle } from './handler.ts'
import { hashToken } from '../_shared/agent/auth.ts'
import { fakePostgrest } from '../_shared/agent/testing/fake_postgrest.ts'

const ALICE = '11111111-1111-1111-1111-111111111111'
const BOB = '22222222-2222-2222-2222-222222222222'

async function setup() {
  const fake = fakePostgrest({
    api_keys: [
      { id: 'key-alice', user_id: ALICE, key_hash: await hashToken('op_alice') },
      { id: 'key-bob', user_id: BOB, key_hash: await hashToken('op_bob') },
    ],
    applications: [
      { id: 1, user_id: ALICE, company_name: 'Stripe', job_title: 'Backend Engineer', status: 'applied', date_applied: '2026-10-01', deleted_at: null },
      { id: 2, user_id: ALICE, company_name: 'Figma', job_title: 'Frontend Engineer', status: 'oa', date_applied: '2026-10-02', deleted_at: '2026-10-05T00:00:00Z' },
      { id: 3, user_id: BOB, company_name: 'Stripe', job_title: 'Software Engineer', status: 'interview', date_applied: '2026-10-03', deleted_at: null },
    ],
    application_events: [
      { id: 1, application_id: 3, user_id: BOB, action: 'create', source: 'app', created_at: '2026-10-03' },
    ],
  })

  const call = async (method: string, path: string, { token = 'op_alice', body }: { token?: string | null; body?: unknown } = {}) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await handle(
      new Request(`http://localhost/agent-api${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
      }),
      fake.rest,
    )
    return { status: res.status, data: await res.json() }
  }

  return { ...fake, call }
}

// --- Auth -----------------------------------------------------------

Deno.test('rejects missing and unknown tokens', async () => {
  const { call } = await setup()
  assert.equal((await call('GET', '/applications', { token: null })).status, 401)
  assert.equal((await call('GET', '/applications', { token: 'op_nope' })).status, 401)
})

// --- Isolation ------------------------------------------------------

Deno.test('isolation: list returns only the caller\'s live rows', async () => {
  const { call } = await setup()
  const { status, data } = await call('GET', '/applications')
  assert.equal(status, 200)
  assert.deepEqual(data.map((r: { id: number }) => r.id), [1])
})

Deno.test('isolation: responses never include user_id', async () => {
  const { call } = await setup()
  const { data } = await call('GET', '/applications')
  assert.ok(!('user_id' in data[0]))
})

Deno.test('isolation: another user\'s application is not found for get, update, delete, restore, events', async () => {
  const { call, tables } = await setup()
  assert.equal((await call('GET', '/applications/3')).status, 404)
  assert.equal((await call('PATCH', '/applications/3', { body: { status: 'rejected' } })).status, 404)
  assert.equal((await call('DELETE', '/applications/3')).status, 404)
  assert.equal((await call('POST', '/applications/3/restore')).status, 404)
  assert.deepEqual((await call('GET', '/applications/3/events')).data, [])

  const bobs = tables.applications.find(r => r.id === 3)!
  assert.equal(bobs.status, 'interview')
  assert.equal(bobs.deleted_at, null)
})

Deno.test('isolation: search cannot widen the user filter', async () => {
  const { call } = await setup()
  for (const search of ['Stripe', 'x*,user_id.neq.foo)', 'a),or=(id.gt.0', '%', '*']) {
    const { status, data } = await call('GET', `/applications?search=${encodeURIComponent(search)}`)
    assert.equal(status, 200, search)
    assert.ok(data.every((r: { id: number }) => r.id === 1), `leak for search ${search}`)
  }
})

Deno.test('isolation: user_id in a create body is rejected', async () => {
  const { call, tables } = await setup()
  const { status } = await call('POST', '/applications', { body: { company_name: 'Evil', user_id: BOB } })
  assert.equal(status, 400)
  assert.equal(tables.applications.length, 3)
})

Deno.test('isolation: id, user_id and deleted_at cannot be patched', async () => {
  const { call } = await setup()
  for (const body of [{ user_id: BOB }, { id: 3 }, { deleted_at: null }]) {
    assert.equal((await call('PATCH', '/applications/1', { body })).status, 400, JSON.stringify(body))
  }
})

Deno.test('isolation: every read and write carries the caller\'s user filter', async () => {
  const { call, requests } = await setup()
  await call('GET', '/applications?search=stripe&status=applied&limit=5')
  await call('GET', '/applications/1')
  await call('PATCH', '/applications/1', { body: { notes: 'called recruiter' } })
  await call('DELETE', '/applications/1')
  await call('POST', '/applications/1/restore')
  await call('GET', '/applications/1/events')
  await call('POST', '/applications', { body: { company_name: 'Notion' } })

  const scoped = requests.filter(r => r.table === 'applications' || r.table === 'application_events')
  assert.ok(scoped.length >= 7)
  for (const r of scoped) {
    if (r.method === 'POST') {
      assert.equal((r.body as { user_id: string }).user_id, ALICE)
    } else {
      assert.deepEqual(r.params.getAll('user_id'), [`eq.${ALICE}`], `${r.method} ${r.table}`)
    }
    assert.equal(r.headers['x-offerplus-source'], 'agent-api')
    assert.equal(r.headers['x-offerplus-key-id'], 'key-alice')
  }
})

// --- Soft delete ----------------------------------------------------

Deno.test('soft delete hides the row, keeps it in the table, and restore brings it back', async () => {
  const { call, tables } = await setup()
  const del = await call('DELETE', '/applications/1')
  assert.equal(del.status, 200)
  assert.ok(tables.applications.find(r => r.id === 1)!.deleted_at)

  assert.equal((await call('GET', '/applications/1')).status, 404)
  assert.equal((await call('PATCH', '/applications/1', { body: { notes: 'x' } })).status, 404)
  assert.deepEqual((await call('GET', '/applications')).data, [])

  assert.equal((await call('POST', '/applications/1/restore')).status, 200)
  assert.equal((await call('GET', '/applications/1')).status, 200)
  assert.equal((await call('POST', '/applications/1/restore')).status, 404, 'restoring a live row')
})

// --- Validation -----------------------------------------------------

Deno.test('create applies defaults and returns 201', async () => {
  const { call } = await setup()
  const { status, data } = await call('POST', '/applications', { body: { company_name: 'Notion', job_title: 'SWE' } })
  assert.equal(status, 201)
  assert.equal(data.status, 'applied')
  assert.ok(data.date_applied)
})

Deno.test('rejects bad input with a 400 and a useful message', async () => {
  const { call } = await setup()
  const cases: [string, string, unknown, RegExp][] = [
    ['POST', '/applications', {}, /company_name is required/],
    ['POST', '/applications', { company_name: 'A', status: 'ghosted' }, /status must be one of/],
    ['POST', '/applications', { company_name: 'A', date_applied: 'yesterday' }, /ISO 8601/],
    ['POST', '/applications', { company_name: 42 }, /must be a string/],
    ['POST', '/applications', ['company_name'], /JSON object/],
    ['POST', '/applications', 'not json', /valid JSON/],
    ['PATCH', '/applications/1', {}, /No fields/],
    ['PATCH', '/applications/1', { notes: 'x'.repeat(10001) }, /at most 10000/],
  ]
  for (const [method, path, body, message] of cases) {
    const { status, data } = await call(method, path, { body })
    assert.equal(status, 400, JSON.stringify(body))
    assert.match(data.error, message)
  }
})

Deno.test('list validates status and limit', async () => {
  const { call, requests } = await setup()
  assert.equal((await call('GET', '/applications?status=ghosted')).status, 400)
  assert.equal((await call('GET', '/applications?limit=abc')).status, 400)
  assert.equal((await call('GET', '/applications?limit=0')).status, 400)
  assert.equal((await call('GET', '/applications?limit=5000')).status, 200)
  assert.equal(requests.at(-1)!.params.get('limit'), '300')
})

Deno.test('unknown routes and non-numeric ids return 404', async () => {
  const { call } = await setup()
  assert.equal((await call('GET', '/applications/abc')).status, 404)
  assert.equal((await call('GET', '/profiles')).status, 404)
  assert.equal((await call('PUT', '/applications/1')).status, 404)
})
