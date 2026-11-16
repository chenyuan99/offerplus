# mcp-server Specification

## Purpose
The Offers+ MCP server (`mcp/`) is a local stdio Model Context Protocol server that
lets an MCP client (such as Claude Code) list, read, create, update and delete the signed-in
user's job applications in the Supabase `applications` table, acting only as that user.

## Requirements
### Requirement: Local stdio transport and configuration
The server SHALL communicate only over stdin/stdout, SHALL open no network listener, and SHALL
write diagnostics to stderr. It SHALL require `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and
`OFFERSPLUS_ACCESS_TOKEN`, and SHALL require `SUPABASE_URL` to use HTTPS, allowing plain HTTP
only for `localhost`, `127.0.0.1` and `[::1]`.

#### Scenario: Missing configuration
- **WHEN** the server starts without one of the three required environment variables
- **THEN** it prints an error naming the required variables to stderr and exits with code 1

#### Scenario: Insecure Supabase URL
- **WHEN** `SUPABASE_URL` is `http://example.com`
- **THEN** the server refuses to start with "SUPABASE_URL must use HTTPS (HTTP allowed only for localhost)."

### Requirement: Acting as the signed-in user
The server SHALL call Supabase with the publishable key and the user's access token, so that
row-level security applies, and SHALL NOT use a service-role key, store passwords, or refresh
tokens. Before every tool call it SHALL validate the access token with Supabase Auth.

#### Scenario: Invalid or expired token
- **WHEN** a tool is called and Supabase Auth rejects the access token
- **THEN** the tool returns an error "Authentication failed. Supply a valid user access token." and no database query is made

### Requirement: Ownership scoping
Every read, update and delete SHALL filter on the authenticated user's id, and
`create_application` SHALL set `user_id` to the authenticated user. Clients SHALL NOT be able
to set or change `user_id`. Applications soft-deleted in the app SHALL NOT be returned, because
row-level security hides them.

#### Scenario: Another user's application
- **WHEN** a user calls `get_application` with the id of an application they do not own
- **THEN** the tool returns an error and no application data

#### Scenario: Attempt to reassign ownership
- **WHEN** `update_application` is called with `updates: { user_id: "other" }`
- **THEN** the call is rejected by input validation before any database query

### Requirement: Application tools
The server SHALL expose exactly five tools: `list_applications`, `get_application`,
`create_application`, `update_application` and `delete_application`. `list_applications` and
`get_application` SHALL be annotated read-only, `delete_application` SHALL be annotated
destructive, and all tools SHALL be annotated as closed-world.

#### Scenario: List applications
- **WHEN** a client calls `list_applications` with an optional `status`, `limit` (1–100, default 25) and `offset` (0–100000, default 0)
- **THEN** it returns the user's applications ordered by `date_applied` then `id`, newest first

#### Scenario: Create an application
- **WHEN** a client calls `create_application` with `job_title`, `company_name`, `job_link`, `company_link`, `status`, `date_applied` and optional `notes`
- **THEN** the application is created for the authenticated user and returned

#### Scenario: Update an application
- **WHEN** a client calls `update_application` with an `id` and a non-empty `updates` object of application fields
- **THEN** only those fields change, `updated_at` is set to the current time, and the updated application is returned

#### Scenario: Delete an application
- **WHEN** a client calls `delete_application` with an `id` and `confirm: true`
- **THEN** the application is permanently deleted (recorded as a `hard_delete` event in `application_events`) and the tool returns `{ "deleted": true, "id": <id> }`

#### Scenario: Delete without confirmation
- **WHEN** `delete_application` is called without `confirm: true`
- **THEN** the call is rejected and nothing is deleted

### Requirement: Input validation
The server SHALL validate tool inputs before querying the database: ids SHALL be positive
integers; `status` SHALL be one of `applied`, `in_progress`, `rejected`, `offer`, `accepted`,
`oa` or `vo`; `job_title` and `company_name` SHALL be 1–500 characters after trimming;
`job_link` and `company_link` SHALL be URLs or empty strings; `date_applied` SHALL be an ISO 8601
timestamp with a timezone offset; and `notes` SHALL be at most 20,000 characters. Unknown fields
in `updates` SHALL be rejected.

#### Scenario: Invalid status
- **WHEN** a client sends `status: "interview"`
- **THEN** the call is rejected with a validation error and no database query is made

### Requirement: Sanitized errors
Database and upstream failures SHALL be reported as MCP tool errors with a generic message and
SHALL NOT include credentials, database internals or raw upstream error text.

#### Scenario: Database failure
- **WHEN** Supabase returns an error for a tool call
- **THEN** the tool returns "Offers+ request failed. Check access permissions and application ID, then retry." with `isError: true`
