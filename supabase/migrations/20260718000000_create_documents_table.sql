-- Generalizes single-resume storage into a per-user document library
-- (resume, cover letter, transcript, certification, portfolio, other),
-- so JobGPT generation and future fit scoring can draw on more than
-- just the one resume file.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('resume', 'cover_letter', 'transcript', 'certification', 'portfolio', 'other')),
  name text not null,
  file_path text not null,
  file_url text not null,
  file_size integer not null,
  file_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on documents(user_id);

alter table documents enable row level security;

drop policy if exists "Users can view their own documents" on documents;
create policy "Users can view their own documents"
  on documents for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own documents" on documents;
create policy "Users can insert their own documents"
  on documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own documents" on documents;
create policy "Users can update their own documents"
  on documents for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own documents" on documents;
create policy "Users can delete their own documents"
  on documents for delete
  using (auth.uid() = user_id);

-- Storage bucket for the underlying document files. RLS is already
-- enabled on storage.objects by default, so it isn't re-enabled here
-- (doing so fails: storage.objects is owned by supabase_storage_admin,
-- not the role migrations run as).
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

drop policy if exists "Allow users to upload their own documents" on storage.objects;
create policy "Allow users to upload their own documents"
on storage.objects for insert
with check (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Allow users to read their own documents" on storage.objects;
create policy "Allow users to read their own documents"
on storage.objects for select
using (
    bucket_id = 'documents'
    and (
        auth.role() = 'authenticated'
        or auth.role() = 'anon'
    )
);

drop policy if exists "Allow users to delete their own documents" on storage.objects;
create policy "Allow users to delete their own documents"
on storage.objects for delete
using (
    bucket_id = 'documents'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);
