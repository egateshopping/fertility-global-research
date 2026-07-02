-- ═══════════════════════════════════════════════════════════════
-- STORAGE POLICY FIX — allow public uploads to doctor-documents
-- Run this in Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Allow anyone to UPLOAD to doctor-documents bucket
CREATE POLICY "Allow public uploads to doctor-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'doctor-documents');

-- Allow anyone to READ from doctor-documents bucket
CREATE POLICY "Allow public reads from doctor-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'doctor-documents');

-- Allow anyone to UPDATE (upsert) in doctor-documents bucket
CREATE POLICY "Allow public updates to doctor-documents"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'doctor-documents');

-- Allow anyone to DELETE from doctor-documents bucket (for admin delete)
CREATE POLICY "Allow public deletes from doctor-documents"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'doctor-documents');
