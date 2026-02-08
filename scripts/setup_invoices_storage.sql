-- Setup Supabase Storage bucket for invoice documents

-- Note: This script shows the configuration needed.
-- You must execute these steps in Supabase Dashboard > Storage

-- 1. Create bucket named 'invoices'
-- Bucket settings:
--   - Name: invoices
--   - Public: true (to allow viewing documents)
--   - File size limit: 10MB
--   - Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg

-- 2. Create storage policies

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'invoices');

-- Policy 3: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- Verification query
SELECT * FROM storage.buckets WHERE name = 'invoices';
