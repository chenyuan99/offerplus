import { createClient } from '@supabase/supabase-js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, OFFERSPLUS_ACCESS_TOKEN } = process.env;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !OFFERSPLUS_ACCESS_TOKEN) {
    throw new Error('Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and OFFERSPLUS_ACCESS_TOKEN.');
  }
  const url = new URL(SUPABASE_URL);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('SUPABASE_URL must use HTTPS (HTTP allowed only for localhost).');
  }
  const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${OFFERSPLUS_ACCESS_TOKEN}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  // Validate the supplied JWT with Supabase Auth on every tool invocation.
  const authenticatedClient = {
    auth: { getUser: () => client.auth.getUser(OFFERSPLUS_ACCESS_TOKEN) },
    from: client.from.bind(client),
  };
  await createServer(authenticatedClient).connect(new StdioServerTransport());
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
