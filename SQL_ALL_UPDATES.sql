-- ============================================
-- Fertility Global Research — Schema update
-- Run ONCE in Supabase → SQL Editor → New Query
-- ============================================

-- 1) Doctors table - all new columns
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_address TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'doctor';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS syndicate_id TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS governorate TEXT;
-- profession values: 'doctor' | 'pharmacist' | 'medical'

-- 2) Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
