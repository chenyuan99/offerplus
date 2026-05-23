import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // --- Auth ---
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json({ error: 'Missing token' }, 401)

  const token = auth.slice(7)
  const keyHash = await hashToken(token)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: apiKey } = await admin
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', keyHash)
    .single()

  if (!apiKey) return json({ error: 'Invalid token' }, 401)

  // Fire-and-forget last_used update
  admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', apiKey.id)

  const userId: string = apiKey.user_id

  // --- Route ---
  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/agent-api/, '')
  const idMatch = path.match(/^\/applications\/(\d+)$/)

  // GET /applications
  if (path === '/applications' && req.method === 'GET') {
    const search = url.searchParams.get('search')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') ?? '100')

    let q = admin
      .from('applications')
      .select('id, job_title, company_name, company_link, job_link, status, date_applied, notes')
      .order('date_applied', { ascending: false })
      .limit(limit)

    if (search) q = q.or(`company_name.ilike.%${search}%,job_title.ilike.%${search}%`)
    if (status) q = q.eq('status', status)

    const { data, error } = await q
    if (error) return json({ error: error.message }, 500)
    return json(data)
  }

  // POST /applications
  if (path === '/applications' && req.method === 'POST') {
    const body = await req.json()
    const { data, error } = await admin
      .from('applications')
      .insert({ ...body, user_id: userId })
      .select()
      .single()
    if (error) return json({ error: error.message }, 500)
    return json(data, 201)
  }

  // PATCH /applications/:id
  if (idMatch && req.method === 'PATCH') {
    const id = parseInt(idMatch[1])
    const body = await req.json()

    // Only allow safe fields to be updated by agents
    const allowed = ['status', 'notes', 'job_title', 'company_name', 'date_applied']
    const update = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await admin
      .from('applications')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return json({ error: error.message }, 500)
    if (!data) return json({ error: 'Not found' }, 404)
    return json(data)
  }

  // GET /applications/:id
  if (idMatch && req.method === 'GET') {
    const id = parseInt(idMatch[1])
    const { data, error } = await admin
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return json({ error: error.message }, 500)
    if (!data) return json({ error: 'Not found' }, 404)
    return json(data)
  }

  return json({ error: 'Not found' }, 404)
})
