import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

const REPO_URL = 'https://github.com/chenyuan99/offerplus';
const SUPABASE_URL = import.meta.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://your-project.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'your-publishable-key';

const TOOLS = [
  { name: 'list_applications', description: 'List your applications, newest first.', inputs: 'Optional status, limit (1–100, default 25), offset' },
  { name: 'get_application', description: 'Get one application.', inputs: 'id' },
  { name: 'create_application', description: 'Add an application.', inputs: 'job_title, company_name, job_link, company_link, status, date_applied; optional notes' },
  { name: 'update_application', description: 'Change some fields on an application.', inputs: 'id, updates (one or more application fields)' },
  { name: 'delete_application', description: 'Permanently delete an application.', inputs: 'id, confirm: true' },
];

const STATUSES = ['applied', 'in_progress', 'rejected', 'offer', 'accepted', 'oa', 'vo'];

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-300 hover:text-white"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="mt-3 mb-4 bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-gray-700">
        <span className="text-xs text-gray-400">{label}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-gray-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function AccessTokenPanel() {
  const [session, setSession] = useState<{ token: string; expiresAt: Date | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ? {
        token: session.access_token,
        expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
      } : null);
      setLoading(false);
    });
  }, []);

  async function copyToken() {
    if (!session) return;
    await navigator.clipboard.writeText(session.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="text-sm text-gray-400">Checking sign-in…</p>;

  if (!session) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        <Link to="/login" className="font-medium text-[#861F41] hover:underline">Sign in</Link> to copy your access token here.
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
      <div className="flex items-start gap-2 text-sm text-amber-800">
        <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
        <p>
          This token signs in as you. Paste it only into your local <code className="font-mono">.env</code> file — never
          into chat, a shared document, or source control.
          {session.expiresAt && ` It expires at ${session.expiresAt.toLocaleTimeString()}.`}
        </p>
      </div>
      <button
        type="button"
        onClick={copyToken}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#861F41] rounded-lg hover:bg-[#621531] transition-colors"
      >
        {copied ? <Check className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy access token'}
      </button>
    </div>
  );
}

export function McpDocs() {
  const envFile = [
    `SUPABASE_URL=${SUPABASE_URL}`,
    `SUPABASE_PUBLISHABLE_KEY=${SUPABASE_PUBLISHABLE_KEY}`,
    'OFFERSPLUS_ACCESS_TOKEN=<paste your access token>',
  ].join('\n');

  const clientConfig = JSON.stringify({
    mcpServers: {
      offersplus: {
        command: 'node',
        args: ['--env-file=/absolute/path/offerplus/mcp/.env', '/absolute/path/offerplus/mcp/src/index.js'],
      },
    },
  }, null, 2);

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-16">
      <SEO
        title="MCP Server | Offers+"
        description="Connect Claude and other AI assistants to your Offers+ job applications with the Offers+ MCP server."
        keywords="MCP, Model Context Protocol, Claude, AI assistant, job application tracker"
        type="article"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xs p-5 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Connect AI assistants with MCP</h1>
          <p className="text-gray-600 mb-8">
            The Offers+ MCP server lets AI assistants that support the{' '}
            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-[#861F41] hover:underline">
              Model Context Protocol
            </a>{' '}
            — such as Claude Code and Claude Desktop — list, add, update and delete your job applications.
            It runs on your own computer and acts only as you, so it can only see and change your applications.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Install</h2>
            <p className="text-gray-600">You need Node.js 22 or later.</p>
            <CodeBlock label="Terminal" code={`git clone ${REPO_URL}.git\ncd offerplus/mcp\nnpm ci`} />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Get your access token</h2>
            <p className="text-gray-600 mb-4">
              The server signs in with your Offers+ access token. Tokens expire after about an hour; when yours does,
              copy a new one here, update <code className="font-mono text-sm">.env</code>, and restart your assistant.
            </p>
            <AccessTokenPanel />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Configure</h2>
            <p className="text-gray-600">
              Create <code className="font-mono text-sm">mcp/.env</code> with the following, replacing the last line
              with your token:
            </p>
            <CodeBlock label="mcp/.env" code={envFile} />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Add it to your assistant</h2>
            <p className="text-gray-600">
              <strong>Claude Code:</strong> from the <code className="font-mono text-sm">offerplus</code> folder, run:
            </p>
            <CodeBlock label="Terminal" code={'claude mcp add offersplus -- node --env-file="$PWD/mcp/.env" "$PWD/mcp/src/index.js"'} />
            <p className="text-gray-600">
              <strong>Other MCP clients</strong> (such as Claude Desktop) that use an <code className="font-mono text-sm">mcpServers</code>{' '}
              configuration — replace the paths with the absolute path to your clone:
            </p>
            <CodeBlock label="MCP client configuration (JSON)" code={clientConfig} />
            <p className="text-gray-600">
              Then ask your assistant something like “List my applications with status oa” or
              “Mark my Stripe application as offer”.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tools</h2>
            <ul className="sm:hidden space-y-3">
              {TOOLS.map(tool => (
                <li key={tool.name} className="p-3 border border-gray-200 rounded-lg text-sm">
                  <p className="font-mono text-gray-900 break-all">{tool.name}</p>
                  <p className="mt-1 text-gray-600">{tool.description}</p>
                  <p className="mt-1 text-gray-500"><span className="font-medium text-gray-700">Inputs:</span> {tool.inputs}</p>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">Tool</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">What it does</th>
                    <th scope="col" className="px-4 py-2 text-left font-medium text-gray-700">Inputs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {TOOLS.map(tool => (
                    <tr key={tool.name}>
                      <td className="px-4 py-2 font-mono text-gray-900 whitespace-nowrap">{tool.name}</td>
                      <td className="px-4 py-2 text-gray-600">{tool.description}</td>
                      <td className="px-4 py-2 text-gray-600">{tool.inputs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 mt-4">
              Statuses: {STATUSES.map((s, i) => (
                <span key={s}><code className="font-mono text-sm">{s}</code>{i < STATUSES.length - 1 ? ', ' : ''}</span>
              ))}. Dates use ISO 8601 with a timezone, for example{' '}
              <code className="font-mono text-sm">2026-11-16T09:00:00Z</code>. Links must be URLs or empty.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>The server runs locally and talks to your assistant over stdin/stdout; it opens no network port.</li>
              <li>Every request is checked against your token, and it can only read or change your own applications.</li>
              <li>Deleting through MCP is permanent and requires the assistant to confirm explicitly.</li>
              <li>Treat application text returned to the assistant as data, not instructions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">MCP server or Agent API key?</h2>
            <p className="text-gray-600">
              Use the MCP server with assistants that support MCP on your own computer. For scripts and hosted agents that
              call a web API instead, create an Agent API key on your{' '}
              <Link to="/profile" className="text-[#861F41] hover:underline">Profile</Link> page. Source and full details are in the{' '}
              <a href={`${REPO_URL}/tree/develop/mcp`} target="_blank" rel="noopener noreferrer" className="text-[#861F41] hover:underline">
                mcp folder on GitHub
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
