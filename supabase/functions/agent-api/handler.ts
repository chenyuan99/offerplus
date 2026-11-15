import type { Rest } from '../_shared/agent/rest.ts'
import { authenticate } from '../_shared/agent/auth.ts'
import { ApiError, applicationsFor } from '../_shared/agent/applications.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

async function readBody(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON')
  }
}

export async function handle(req: Request, rest: Rest): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const caller = await authenticate(rest, req.headers.get('Authorization'))
  if (!caller) return json({ error: 'Invalid or missing token' }, 401)

  const apps = applicationsFor(rest, caller)
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/(functions\/v1\/)?agent-api/, '').replace(/\/$/, '')
  const match = path.match(/^\/applications\/(\d{1,15})(\/restore|\/events)?$/)
  const id = match ? Number(match[1]) : null
  const sub = match?.[2]

  try {
    if (path === '/applications') {
      if (req.method === 'GET') {
        return json(await apps.list({
          status: url.searchParams.get('status'),
          search: url.searchParams.get('search'),
          limit: url.searchParams.get('limit'),
        }))
      }
      if (req.method === 'POST') return json(await apps.create(await readBody(req)), 201)
    }

    if (id !== null && !sub) {
      if (req.method === 'GET') return json(await apps.get(id))
      if (req.method === 'PATCH') return json(await apps.update(id, await readBody(req)))
      if (req.method === 'DELETE') return json(await apps.remove(id))
    }

    if (id !== null && sub === '/restore' && req.method === 'POST') return json(await apps.restore(id))
    if (id !== null && sub === '/events' && req.method === 'GET') return json(await apps.events(id))

    return json({ error: 'Not found' }, 404)
  } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status)
    console.error('agent-api unhandled error', e)
    return json({ error: 'Internal error' }, 500)
  }
}
