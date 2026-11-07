// Minimal PostgREST client using the service role key.
// The service role bypasses RLS, so callers must go through applications.ts,
// which adds the user filter to every query.

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface Rest {
  request(path: string, init?: { method?: string; body?: unknown; headers?: Record<string, string> }): Promise<Response>
}

export function createRest(baseUrl: string, serviceKey: string, fetchImpl: FetchLike = fetch): Rest {
  return {
    request(path, { method = 'GET', body, headers = {} } = {}) {
      return fetchImpl(`${baseUrl}/rest/v1${path}`, {
        method,
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    },
  }
}

export function restFromEnv(): Rest {
  return createRest(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}
