// User-scoped access to applications. This is the only module that may
// query applications or application_events with the service role: every
// request it builds starts with `user_id=eq.<caller>`.

import type { Rest } from './rest.ts'
import type { Caller } from './auth.ts'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// ApplicationStatus in frontend/src/types/supabase.ts, plus 'interview',
// which the offerplus-gmail-sync skill already writes.
export const STATUSES = ['applied', 'in_progress', 'oa', 'vo', 'interview', 'offer', 'accepted', 'rejected'] as const

const COLUMNS = 'id,job_title,company_name,company_link,job_link,status,date_applied,notes,created_at,updated_at'
const EVENT_COLUMNS = 'id,application_id,action,source,before,after,created_at'

const MAX_LENGTH: Record<string, number> = {
  job_title: 300,
  company_name: 300,
  company_link: 2000,
  job_link: 2000,
  status: 32,
  date_applied: 64,
  notes: 10000,
}
const WRITABLE = Object.keys(MAX_LENGTH)

export const MAX_LIMIT = 300
const DEFAULT_LIMIT = 100

export interface ListOptions {
  status?: string | null
  search?: string | null
  limit?: string | number | null
}

export function parseLimit(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined || raw === '') return DEFAULT_LIMIT
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isInteger(n) || n < 1) throw new ApiError(400, `limit must be an integer between 1 and ${MAX_LIMIT}`)
  return Math.min(n, MAX_LIMIT)
}

function checkStatus(status: unknown): string {
  if (typeof status !== 'string' || !(STATUSES as readonly string[]).includes(status)) {
    throw new ApiError(400, `status must be one of: ${STATUSES.join(', ')}`)
  }
  return status
}

// Strips characters that carry meaning inside a PostgREST or=(...) filter.
export function sanitizeSearch(search: string): string {
  return search.replace(/[,()"'\\*%:]/g, ' ').trim().slice(0, 100)
}

export function validateFields(body: unknown, { requireCompany }: { requireCompany: boolean }): Record<string, string | null> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be a JSON object')
  }

  const unknown = Object.keys(body).filter(k => !WRITABLE.includes(k))
  if (unknown.length) {
    throw new ApiError(400, `Unknown or read-only fields: ${unknown.join(', ')}. Allowed: ${WRITABLE.join(', ')}`)
  }

  const out: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(body)) {
    if (value === null && key !== 'company_name' && key !== 'status') {
      out[key] = null
      continue
    }
    if (typeof value !== 'string') throw new ApiError(400, `${key} must be a string`)
    if (value.length > MAX_LENGTH[key]) throw new ApiError(400, `${key} must be at most ${MAX_LENGTH[key]} characters`)
    out[key] = value
  }

  if (out.status !== undefined) checkStatus(out.status)
  if (out.date_applied && Number.isNaN(Date.parse(out.date_applied))) {
    throw new ApiError(400, 'date_applied must be an ISO 8601 date')
  }
  if (requireCompany && !out.company_name?.trim()) throw new ApiError(400, 'company_name is required')
  if (!requireCompany && Object.keys(out).length === 0) throw new ApiError(400, 'No fields to update')

  return out
}

export function applicationsFor(rest: Rest, caller: Caller, source = 'agent-api') {
  const scope = `user_id=eq.${encodeURIComponent(caller.userId)}`
  const headers = { 'x-offerplus-source': source, 'x-offerplus-key-id': caller.keyId }

  // Reads, updates and deletes are filtered by owner; inserts carry the owner
  // in the body instead (create() sets user_id last so it can't be overridden).
  async function call(method: string, table: string, query: string, body?: unknown) {
    const qs = method === 'POST' ? query : `${scope}&${query}`
    const res = await rest.request(`/${table}?${qs}`, { method, body, headers })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      console.error(`agent-api ${method} ${table} failed`, res.status, data)
      throw new ApiError(502, 'Database request failed')
    }
    return data
  }

  const one = (rows: unknown) => {
    const row = Array.isArray(rows) ? rows[0] : rows
    if (!row) throw new ApiError(404, 'Application not found')
    return row
  }

  const live = 'deleted_at=is.null'

  return {
    list(opts: ListOptions = {}) {
      let qs = `${live}&select=${COLUMNS}&order=date_applied.desc.nullslast,id.desc&limit=${parseLimit(opts.limit)}`
      if (opts.status) qs += `&status=eq.${checkStatus(opts.status)}`
      const search = opts.search ? sanitizeSearch(opts.search) : ''
      if (search) {
        qs += `&or=${encodeURIComponent(`(company_name.ilike.*${search}*,job_title.ilike.*${search}*)`)}`
      }
      return call('GET', 'applications', qs)
    },

    async get(id: number) {
      return one(await call('GET', 'applications', `id=eq.${id}&${live}&select=${COLUMNS}&limit=1`))
    },

    async create(body: unknown) {
      const fields = validateFields(body, { requireCompany: true })
      const row = {
        status: 'applied',
        date_applied: new Date().toISOString(),
        ...fields,
        user_id: caller.userId,
      }
      return one(await call('POST', 'applications', `select=${COLUMNS}`, row))
    },

    async update(id: number, body: unknown) {
      const fields = validateFields(body, { requireCompany: false })
      return one(await call('PATCH', 'applications', `id=eq.${id}&${live}&select=${COLUMNS}`, fields))
    },

    // Soft delete: the row stays restorable and its history is kept.
    async remove(id: number) {
      return one(await call('PATCH', 'applications', `id=eq.${id}&${live}&select=${COLUMNS}`, {
        deleted_at: new Date().toISOString(),
      }))
    },

    async restore(id: number) {
      return one(await call('PATCH', 'applications', `id=eq.${id}&deleted_at=not.is.null&select=${COLUMNS}`, {
        deleted_at: null,
      }))
    },

    events(id: number) {
      return call('GET', 'application_events', `application_id=eq.${id}&select=${EVENT_COLUMNS}&order=created_at.desc&limit=${MAX_LIMIT}`)
    },
  }
}
