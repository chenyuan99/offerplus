// Agent API against real Postgres + PostgREST. Started by run.sh; skipped
// when its environment is missing, so plain `deno test` stays offline.

import assert from 'node:assert/strict'
import { handle } from '../handler.ts'
import { hashToken } from '../../_shared/agent/auth.ts'
import { createRest } from '../../_shared/agent/rest.ts'

const env = (name: string) =>
  Deno.permissions.querySync({ name: 'env', variable: name }).state === 'granted' ? Deno.env.get(name) : undefined
const URL_ = env('AGENT_API_IT_URL')
const SECRET = env('AGENT_API_IT_JWT_SECRET')

const ALICE = '11111111-1111-1111-1111-111111111111'
const BOB = '22222222-2222-2222-2222-222222222222'

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function signJwt(claims: Record<string, unknown>): Promise<string> {
  const enc = new TextEncoder()
  const head = b64url(enc.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = b64url(enc.encode(JSON.stringify({ ...claims, exp: Math.floor(Date.now() / 1000) + 3600 })))
  const key = await crypto.subtle.importKey('raw', enc.encode(SECRET!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${head}.${body}`)))
  return `${head}.${body}.${b64url(sig)}`
}

// PostgREST is served at the root here, not under /rest/v1 as on Supabase.
const direct = (input: string, init?: RequestInit) => fetch(input.replace('/rest/v1', ''), init)

// Plain PostgREST call with a given JWT: the web app (user JWT) or an admin view (service role).
async function pg(jwt: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${URL_}${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, data: text ? JSON.parse(text) : null }
}

Deno.test({
  name: 'agent API on real Postgres + PostgREST',
  ignore: !URL_ || !SECRET,
  async fn(t) {
    const service = await signJwt({ role: 'service_role' })
    const aliceWeb = await signJwt({ role: 'authenticated', sub: ALICE })
    const bobWeb = await signJwt({ role: 'authenticated', sub: BOB })
    const rest = createRest(URL_!, service, direct)

    const keys = await pg(service, 'POST', '/api_keys', [
      { user_id: ALICE, key_hash: await hashToken('op_alice'), name: 'alice' },
      { user_id: BOB, key_hash: await hashToken('op_bob'), name: 'bob' },
    ])
    assert.equal(keys.status, 201, JSON.stringify(keys.data))
    const aliceKeyId = keys.data.find((k: { name: string }) => k.name === 'alice').id

    const api = async (token: string, method: string, path: string, body?: unknown) => {
      const res = await handle(
        new Request(`http://localhost/agent-api${path}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
        }),
        rest,
      )
      return { status: res.status, data: await res.json() }
    }
    const events = async (id: number) =>
      (await pg(service, 'GET', `/application_events?application_id=eq.${id}&order=id.asc`)).data

    let stripe = 0, figma = 0, bobs = 0

    await t.step('create, list, search and filter through real PostgREST syntax', async () => {
      const a = await api('op_alice', 'POST', '/applications', { company_name: 'Stripe', job_title: 'Backend Engineer', date_applied: '2026-10-01' })
      const b = await api('op_alice', 'POST', '/applications', { company_name: 'Figma', job_title: 'Frontend Engineer', status: 'oa', date_applied: '2026-10-02' })
      const c = await api('op_bob', 'POST', '/applications', { company_name: 'Stripe', job_title: 'Software Engineer' })
      for (const r of [a, b, c]) assert.equal(r.status, 201, JSON.stringify(r.data))
      ;[stripe, figma, bobs] = [a.data.id, b.data.id, c.data.id]
      assert.ok(!('user_id' in a.data))

      const all = await api('op_alice', 'GET', '/applications')
      assert.deepEqual(all.data.map((r: { id: number }) => r.id), [figma, stripe], 'newest first, alice only')

      const search = await api('op_alice', 'GET', '/applications?search=' + encodeURIComponent('stripe engineer'))
      assert.equal(search.status, 200)
      const byCompany = await api('op_alice', 'GET', '/applications?search=stri')
      assert.deepEqual(byCompany.data.map((r: { id: number }) => r.id), [stripe])

      const injected = await api('op_alice', 'GET', '/applications?search=' + encodeURIComponent('x*,user_id.neq.0)'))
      assert.equal(injected.status, 200)
      assert.deepEqual(injected.data, [])

      const oa = await api('op_alice', 'GET', '/applications?status=oa')
      assert.deepEqual(oa.data.map((r: { id: number }) => r.id), [figma])
    })

    await t.step('isolation: bob cannot read or change alice\'s application', async () => {
      assert.equal((await api('op_bob', 'GET', `/applications/${stripe}`)).status, 404)
      assert.equal((await api('op_bob', 'PATCH', `/applications/${stripe}`, { status: 'rejected' })).status, 404)
      assert.equal((await api('op_bob', 'DELETE', `/applications/${stripe}`)).status, 404)
      assert.deepEqual((await api('op_bob', 'GET', `/applications/${stripe}/events`)).data, [])

      const row = (await pg(service, 'GET', `/applications?id=eq.${stripe}`)).data[0]
      assert.equal(row.status, 'applied')
      assert.equal(row.deleted_at, null)
      assert.equal(row.user_id, ALICE)
    })

    await t.step('trigger records agent updates with source and key', async () => {
      const r = await api('op_alice', 'PATCH', `/applications/${stripe}`, { status: 'interview' })
      assert.equal(r.status, 200, JSON.stringify(r.data))
      const ev = (await events(stripe)).at(-1)
      assert.equal(ev.action, 'update')
      assert.equal(ev.source, 'agent-api')
      assert.equal(ev.api_key_id, aliceKeyId)
      assert.equal(ev.user_id, ALICE)
      assert.equal(ev.before.status, 'applied')
      assert.equal(ev.after.status, 'interview')
    })

    await t.step('no-op updates do not add history', async () => {
      const before = (await events(stripe)).length
      await api('op_alice', 'PATCH', `/applications/${stripe}`, { status: 'interview' })
      assert.equal((await events(stripe)).length, before)
    })

    await t.step('web app writes are recorded with source app', async () => {
      const r = await pg(aliceWeb, 'PATCH', `/applications?id=eq.${stripe}`, { notes: 'from the web app' })
      assert.equal(r.status, 200, JSON.stringify(r.data))
      const ev = (await events(stripe)).at(-1)
      assert.equal(ev.source, 'app')
      assert.equal(ev.api_key_id, null)
    })

    await t.step('soft delete hides the row from the web app and restore brings it back', async () => {
      assert.equal((await api('op_alice', 'DELETE', `/applications/${figma}`)).status, 200)
      assert.equal((await events(figma)).at(-1).action, 'delete')

      assert.deepEqual((await pg(aliceWeb, 'GET', `/applications?id=eq.${figma}`)).data, [], 'hidden by RLS')
      assert.ok((await pg(service, 'GET', `/applications?id=eq.${figma}`)).data[0].deleted_at, 'still stored')
      assert.equal((await api('op_alice', 'GET', `/applications/${figma}`)).status, 404)

      const web = await pg(aliceWeb, 'PATCH', `/applications?id=eq.${figma}`, { notes: 'edit a deleted row' })
      assert.deepEqual(web.data, [], 'web app cannot edit a deleted row')

      assert.equal((await api('op_alice', 'POST', `/applications/${figma}/restore`)).status, 200)
      assert.equal((await events(figma)).at(-1).action, 'restore')
      assert.equal((await pg(aliceWeb, 'GET', `/applications?id=eq.${figma}`)).data.length, 1)
    })

    await t.step('events are readable only by their owner and never writable by users', async () => {
      const mine = (await pg(aliceWeb, 'GET', '/application_events')).data
      assert.ok(mine.length > 0)
      assert.ok(mine.every((e: { user_id: string }) => e.user_id === ALICE))

      const theirs = (await pg(bobWeb, 'GET', `/application_events?application_id=eq.${stripe}`)).data
      assert.deepEqual(theirs, [])

      const forged = await pg(aliceWeb, 'POST', '/application_events', { application_id: bobs, user_id: ALICE, action: 'create' })
      assert.ok(forged.status >= 400, `forged event accepted: ${forged.status}`)

      const viaApi = await api('op_alice', 'GET', `/applications/${stripe}/events`)
      assert.equal(viaApi.status, 200)
      assert.deepEqual(viaApi.data.map((e: { action: string }) => e.action), ['update', 'update', 'create'])
    })

    await t.step('history outlives a hard delete from the web app', async () => {
      const del = await pg(aliceWeb, 'DELETE', `/applications?id=eq.${stripe}`)
      assert.equal(del.status, 200, JSON.stringify(del.data))
      const ev = (await events(stripe)).at(-1)
      assert.equal(ev.action, 'hard_delete')
      assert.equal(ev.before.company_name, 'Stripe')
    })
  },
})
