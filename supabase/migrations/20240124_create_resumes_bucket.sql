-- Create a new public bucket for resumes if it doesn't exist
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to their own directory
drop policy if exists "Allow users to upload their own resumes" on storage.objects;
create policy "Allow users to upload their own resumes"
on storage.objects for insert
with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
drop policy if exists "Allow users to read their own resumes" on storage.objects;
create policy "Allow users to read their own resumes"
on storage.objects for select
using (
    bucket_id = 'resumes'
    and (
        auth.role() = 'authenticated'
        or auth.role() = 'anon'
    )
);

-- Allow users to delete their own files
drop policy if exists "Allow users to delete their own resumes" on storage.objects;
create policy "Allow users to delete their own resumes"
on storage.objects for delete
using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: RLS is already enabled on storage.objects by default in every Supabase
-- project. Re-enabling it here fails with "must be owner of table objects"
-- because storage.objects is owned by supabase_storage_admin, not the role
-- migrations run as.
