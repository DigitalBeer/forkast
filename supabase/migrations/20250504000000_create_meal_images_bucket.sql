-- Create storage bucket for meal images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-images', 'meal-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "Authenticated users can upload meal images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images
create policy "Users can update their own meal images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
create policy "Users can delete their own meal images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view meal images (bucket is public)
create policy "Anyone can view meal images"
on storage.objects for select
to public
using (bucket_id = 'meal-images');
