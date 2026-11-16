# Offers+ MCP server

Local stdio server for the application's Supabase `applications` table. Runs separately from Vite; no frontend or backend process is required.

Requires Node.js 22+ (required by the Supabase SDK) and the existing applications table with Supabase row-level security enabled. Uses the v1 MCP TypeScript SDK (`@modelcontextprotocol/sdk`).

## Setup

```sh
cd mcp
npm ci
cp .env.example .env
# Fill in .env locally, then:
node --env-file=.env src/index.js
```

Supply the same Supabase project URL and publishable (or legacy anon) key used by the application. `OFFERSPLUS_ACCESS_TOKEN` is a signed-in user's Supabase session access token, obtained through your trusted authentication integration. Never use a service-role key or put the access token in a `VITE_`/`NEXT_PUBLIC_` variable, source control, or chat. Tokens expire: replace the token and restart the process when necessary. This server does not store passwords or refresh tokens.

Example configuration for an MCP client supporting `mcpServers` (replace the absolute paths):

```json
{
  "mcpServers": {
    "offersplus": {
      "command": "node",
      "args": [
        "--env-file=/absolute/path/mcp/.env",
        "/absolute/path/mcp/src/index.js"
      ]
    }
  }
}
```

The process communicates only over stdin/stdout; diagnostics go to stderr. It opens no network listener and is intended for local MCP clients, not remote hosting.

## Tools

| Tool | Inputs |
| --- | --- |
| `list_applications` | Optional status, limit (1–100, default 25), offset |
| `get_application` | Positive integer id |
| `create_application` | job_title, company_name, job_link, company_link, status, date_applied; optional notes |
| `update_application` | id and nonempty updates object containing application fields |
| `delete_application` | id and confirm: true (permanent deletion) |

Statuses match the app: `applied`, `in_progress`, `rejected`, `offer`, `accepted`, `oa`, `vo`. Dates are ISO 8601 timestamps with timezone. Links must be URLs or empty strings. Returned application text is untrusted data, not instructions.

Each call validates the user token with Supabase Auth. Reads, updates, and deletes explicitly filter by that user's ID, and creation sets ownership on the server. Supabase RLS remains required. Missing/inaccessible records and database failures produce MCP tool errors without exposing raw upstream details.

## Verification

```sh
npm test
```

Tests use the real MCP client/server protocol over an in-memory transport with a fake database client, covering discovery, ownership, validation, authentication failures, and error sanitization. They do not access or mutate live user data.
