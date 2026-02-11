-- Fix RLS policies for Documentation Storage
-- This script explicitly allows access to the 'documentation' bucket
-- using unique policy names to avoid conflicts with other storage policies.

-- 1. Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentation', 'documentation', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop potential conflicting policies if they were created erroneously for this bucket
-- (We can't easily iterate and drop by definition, but we can ensure our new ones are clean)

-- 3. Create permissive policies for the 'documentation' bucket
-- Using specific names to avoid collision with generic "Full Access" policies on storage.objects

DO $$ 
BEGIN
  -- SELECT Policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket Select' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket Select" ON storage.objects FOR SELECT USING (bucket_id = 'documentation');
  END IF;

  -- INSERT Policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket Insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentation');
  END IF;
  
  -- UPDATE Policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket Update" ON storage.objects FOR UPDATE USING (bucket_id = 'documentation');
  END IF;

  -- DELETE Policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Documentation Bucket Delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
    CREATE POLICY "Documentation Bucket Delete" ON storage.objects FOR DELETE USING (bucket_id = 'documentation');
  END IF;
END $$;
