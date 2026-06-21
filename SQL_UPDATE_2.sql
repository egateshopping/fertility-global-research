-- ============================================
-- Fertility Global Research — Schema update
-- Run this in Supabase → SQL Editor → New Query
-- ============================================

-- 1) New columns on doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_address TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'doctor';
-- profession values: 'doctor' | 'pharmacist' | 'medical'

-- 2) Reports table (fake-account reports)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
