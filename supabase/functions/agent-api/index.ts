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

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function db(path: string, method = 'GET', body?: unknown, extraHeaders?: Record<string, string>) {
  const url = `${Deno.env.get('SUPABASE_URL')}/rest/v1${path}`
  return fetch(url, {
    method,
    headers: {
      'apikey': Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // --- Auth ---
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Missing token' }, 401)

  const token = auth.slice(7)
  const keyHash = await hashToken(token)

  const keyRes = await db(`/api_keys?key_hash=eq.${keyHash}&select=id,user_id&limit=1`)
  const keys = await keyRes.json()
  if (!keys?.length) return json({ error: 'Invalid token' }, 401)

  const { id: keyId, user_id: userId } = keys[0]

  // Fire-and-forget last_used update
  db(`/api_keys?id=eq.${keyId}`, 'PATCH', { last_used_at: new Date().toISOString() })

  // --- Route ---
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/agent-api/, '')
  const idMatch = path.match(/^\/applications\/(\d+)$/)

  // GET /applications
  if (path === '/applications' && req.method === 'GET') {
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const limit = url.searchParams.get('limit') ?? '100'

    let qs = `user_id=eq.${userId}&order=date_applied.desc&limit=${limit}`
    qs += `&select=id,job_title,company_name,company_link,job_link,status,date_applied,notes`
    if (status) qs += `&status=eq.${status}`
    if (search) {
      const enc = encodeURIComponent(`company_name.ilike.*${search}*,job_title.ilike.*${search}*`)
      qs += `&or=(${enc})`
    }

    const res = await db(`/applications?${qs}`)
    const data = await res.json()
    if (!res.ok) return json({ error: data }, 500)
    return json(data)
  }

  // POST /applications
  if (path === '/applications' && req.method === 'POST') {
    const body = await req.json()
    const res = await db('/applications', 'POST', { ...body, user_id: userId })
    const data = await res.json()
    if (!res.ok) return json({ error: data }, 500)
    return json(Array.isArray(data) ? data[0] : data, 201)
  }

  // PATCH /applications/:id
  if (idMatch && req.method === 'PATCH') {
    const id = idMatch[1]
    const body = await req.json()

    const allowed = ['status', 'notes', 'job_title', 'company_name', 'date_applied']
    const update = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    const res = await db(`/applications?id=eq.${id}&user_id=eq.${userId}`, 'PATCH', update)
    const data = await res.json()
    if (!res.ok) return json({ error: data }, 500)
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return json({ error: 'Not found' }, 404)
    return json(row)
  }

  // GET /applications/:id
  if (idMatch && req.method === 'GET') {
    const id = idMatch[1]
    const res = await db(`/applications?id=eq.${id}&user_id=eq.${userId}&limit=1`)
    const data = await res.json()
    if (!res.ok) return json({ error: data }, 500)
    if (!data?.length) return json({ error: 'Not found' }, 404)
    return json(data[0])
  }

  return json({ error: 'Not found' }, 404)
})
