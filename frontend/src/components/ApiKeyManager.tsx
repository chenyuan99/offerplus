import { useEffect, useState } from 'react'
import { Copy, Plus, Trash2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ApiKey {
  id: string
  name: string
  created_at: string
  last_used_at: string | null
}

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return 'op_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashToken(token: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function ApiKeyManager() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchKeys() }, [])

  async function fetchKeys() {
    const { data } = await supabase.from('api_keys').select('id, name, created_at, last_used_at').order('created_at', { ascending: false })
    setKeys(data ?? [])
    setLoading(false)
  }

  async function createKey() {
    if (!newKeyName.trim()) return
    setIsCreating(true)
    const token = generateToken()
    const key_hash = await hashToken(token)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('api_keys').insert({ name: newKeyName.trim(), key_hash, user_id: user.id })
    if (!error) {
      setGeneratedToken(token)
      setNewKeyName('')
      setShowForm(false)
      fetchKeys()
    }
    setIsCreating(false)
  }

  async function revokeKey(id: string) {
    await supabase.from('api_keys').delete().eq('id', id)
    setKeys(k => k.filter(k => k.id !== id))
  }

  async function copyToken() {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fmt = (iso: string) => new Date(iso).toLocaleDateString()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Agent API Keys</h3>
          <p className="text-sm text-gray-500">Allow external AI agents to read and update your applications.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#861F41] rounded-lg hover:bg-[#621531] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Key
        </button>
      </div>

      {/* One-time token display */}
      {generatedToken && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <p className="text-sm font-medium text-amber-800">Copy this key now — it won't be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-3 py-2 font-mono break-all">
              {generatedToken}
            </code>
            <button onClick={copyToken} className="p-2 text-amber-700 hover:text-amber-900">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={() => setGeneratedToken(null)} className="text-xs text-amber-600 hover:underline">
            I've saved it
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Key name (e.g. Claude Agent)"
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createKey()}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#861F41]"
            autoFocus
          />
          <button onClick={createKey} disabled={isCreating || !newKeyName.trim()}
            className="px-3 py-2 text-sm font-medium text-white bg-[#861F41] rounded-lg hover:bg-[#621531] disabled:opacity-50 transition-colors">
            {isCreating ? 'Creating…' : 'Create'}
          </button>
          <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
        </div>
      )}

      {/* Key list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-400">No API keys yet.</p>
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {keys.map(key => (
            <div key={key.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-900">{key.name}</p>
                <p className="text-xs text-gray-400">
                  Created {fmt(key.created_at)}
                  {key.last_used_at && ` · Last used ${fmt(key.last_used_at)}`}
                </p>
              </div>
              <button onClick={() => revokeKey(key.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">Usage</p>
        <code className="block text-xs">
          PATCH https://lwexhbimtxpndhsidogl.supabase.co/functions/v1/agent-api/applications/:id
        </code>
        <code className="block text-xs">Authorization: Bearer op_...</code>
        <code className="block text-xs">{`{ "status": "interview" }`}</code>
      </div>
    </div>
  )
}
