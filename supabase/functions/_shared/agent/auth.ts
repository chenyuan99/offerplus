import type { Rest } from './rest.ts'

export interface Caller {
  userId: string
  keyId: string
}

export async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Resolves a `Bearer op_...` header to the key's owner, or null if invalid.
export async function authenticate(rest: Rest, authorization: string | null): Promise<Caller | null> {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice(7).trim()
  if (!token) return null

  const keyHash = await hashToken(token)
  const res = await rest.request(`/api_keys?key_hash=eq.${keyHash}&select=id,user_id&limit=1`)
  if (!res.ok) return null
  const keys = await res.json()
  if (!keys?.length) return null

  const { id: keyId, user_id: userId } = keys[0]

  // Fire-and-forget last_used update
  rest.request(`/api_keys?id=eq.${keyId}`, { method: 'PATCH', body: { last_used_at: new Date().toISOString() } })
    .catch(() => {})

  return { userId, keyId }
}
