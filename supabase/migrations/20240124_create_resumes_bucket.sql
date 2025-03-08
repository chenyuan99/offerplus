-- Create a new public bucket for resumes if it doesn't exist
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to their own directory
create policy "Allow users to upload their own resumes"
on storage.objects for insert
with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()
);

-- Allow users to read their own files
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
create policy "Allow users to delete their own resumes"
on storage.objects for delete
using (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()
);

-- Enable RLS
alter table storage.objects enable row level security;
