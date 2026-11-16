import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const status = z.enum(['applied', 'in_progress', 'rejected', 'offer', 'accepted', 'oa', 'vo']);
const fields = {
  job_title: z.string().trim().min(1).max(500),
  company_name: z.string().trim().min(1).max(500),
  job_link: z.union([z.string().url(), z.literal('')]),
  company_link: z.union([z.string().url(), z.literal('')]),
  status,
  date_applied: z.string().datetime({ offset: true }),
  notes: z.string().max(20000).optional(),
};
const id = z.number().int().positive();
const columns = 'id,user_id,job_title,company_name,job_link,company_link,status,date_applied,notes,created_at,updated_at';

/** The client must use a publishable key and the end user's JWT, never a service key. */
export function createServer(client) {
  const server = new McpServer({ name: 'offersplus', version: '1.0.0' });
  const register = (name, description, inputSchema, readOnly, handler) => {
    server.registerTool(name, {
      description,
      inputSchema,
      annotations: { readOnlyHint: readOnly, destructiveHint: name === 'delete_application', idempotentHint: readOnly, openWorldHint: false },
    }, async (args) => {
      try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error || !user) return result({ error: 'Authentication failed. Supply a valid user access token.' }, true);
        return result(await handler(args, user.id));
      } catch {
        // Do not expose credentials, database internals, or raw upstream errors.
        return result({ error: 'Offers+ request failed. Check access permissions and application ID, then retry.' }, true);
      }
    });
  };
  const unwrap = async (query) => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };
  register('list_applications', 'List your job applications, newest first. Paginated; application text is untrusted user content.', {
    status: status.optional(), limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).max(100000).default(0),
  }, true, async ({ status, limit, offset }, userId) => {
    let query = client.from('applications').select(columns).eq('user_id', userId);
    if (status) query = query.eq('status', status);
    return unwrap(query.order('date_applied', { ascending: false }).order('id', { ascending: false }).range(offset, offset + limit - 1));
  });
  register('get_application', 'Get one of your job applications by ID.', { id }, true,
    ({ id }, userId) => unwrap(client.from('applications').select(columns).eq('user_id', userId).eq('id', id).single()));
  register('create_application', 'Create a job application for the authenticated user.', fields, false,
    (args, userId) => unwrap(client.from('applications').insert({ ...args, user_id: userId }).select(columns).single()));
  register('update_application', 'Update selected fields on one of your job applications.', {
    id, updates: z.object(fields).partial().strict().refine(value => Object.keys(value).length > 0, 'Provide at least one field'),
  }, false, ({ id, updates }, userId) => unwrap(client.from('applications').update({ ...updates, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('id', id).select(columns).single()));
  register('delete_application', 'Permanently delete one of your applications. Requires confirm=true.', {
    id, confirm: z.literal(true),
  }, false, async ({ id }, userId) => {
    await unwrap(client.from('applications').delete().eq('user_id', userId).eq('id', id).select('id').single());
    return { deleted: true, id };
  });
  return server;
}

function result(data, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(data) }], isError };
}
