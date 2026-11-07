// In-memory stand-in for PostgREST, covering only the filter syntax the
// agent API uses. Unknown syntax throws, so a filter that escapes
// sanitising fails a test rather than silently matching everything.

import { createRest, type Rest } from '../rest.ts'

type Row = Record<string, unknown>

export interface RecordedRequest {
  method: string
  table: string
  params: URLSearchParams
  body: unknown
  headers: Record<string, string>
}

function colFilter(col: string, expr: string): (r: Row) => boolean {
  if (expr === 'is.null') return r => r[col] == null
  if (expr === 'not.is.null') return r => r[col] != null
  if (expr.startsWith('eq.')) return r => String(r[col]) === expr.slice(3)
  throw new Error(`fake_postgrest: unsupported filter ${col}=${expr}`)
}

function orFilter(expr: string): (r: Row) => boolean {
  if (!expr.startsWith('(') || !expr.endsWith(')')) throw new Error(`fake_postgrest: bad or=${expr}`)
  const clauses = expr.slice(1, -1).split(',').map(clause => {
    const m = clause.match(/^(\w+)\.ilike\.(.*)$/)
    if (!m) throw new Error(`fake_postgrest: unsupported or clause ${clause}`)
    const [, col, pattern] = m
    const re = new RegExp('^' + pattern.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i')
    return (r: Row) => re.test(String(r[col] ?? ''))
  })
  return r => clauses.some(c => c(r))
}

export function fakePostgrest(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = structuredClone(seed)
  const requests: RecordedRequest[] = []
  let nextId = 1000

  const fetchImpl = (input: string, init: RequestInit = {}): Promise<Response> => {
    const url = new URL(input)
    const table = url.pathname.replace('/rest/v1/', '')
    const method = init.method ?? 'GET'
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined
    requests.push({ method, table, params: url.searchParams, body, headers: init.headers as Record<string, string> })

    const rows = (tables[table] ??= [])
    const filters: ((r: Row) => boolean)[] = []
    for (const [key, value] of url.searchParams) {
      if (key === 'select' || key === 'order' || key === 'limit') continue
      filters.push(key === 'or' ? orFilter(value) : colFilter(key, value))
    }
    const matches = (r: Row) => filters.every(f => f(r))

    const select = url.searchParams.get('select')
    const project = (r: Row) =>
      select ? Object.fromEntries(select.split(',').filter(c => c in r).map(c => [c, r[c]])) : { ...r }
    const respond = (data: Row[], status = 200) =>
      Promise.resolve(new Response(JSON.stringify(data.map(project)), { status }))

    if (method === 'GET') {
      const limit = Number(url.searchParams.get('limit') ?? Infinity)
      return respond(rows.filter(matches).slice(0, limit))
    }
    if (method === 'POST') {
      const row = { id: nextId++, deleted_at: null, ...body }
      rows.push(row)
      return respond([row], 201)
    }
    if (method === 'PATCH') {
      const hit = rows.filter(matches)
      hit.forEach(r => Object.assign(r, body))
      return respond(hit)
    }
    throw new Error(`fake_postgrest: unsupported method ${method}`)
  }

  const rest: Rest = createRest('http://fake', 'service-key', fetchImpl)
  return { rest, tables, requests }
}
