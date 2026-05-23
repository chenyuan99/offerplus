-- API keys for external agents (e.g. Claude Code skills)
-- Tokens are generated client-side; only the SHA-256 hash is stored here.

create table if not exists api_keys (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  key_hash     text not null unique,
  name         text not null default 'My Agent',
  last_used_at timestamptz,
  created_at   timestamptz default now()
);

alter table api_keys enable row level security;

create policy "Users manage their own API keys"
  on api_keys for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
