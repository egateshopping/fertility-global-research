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

-- 3) New columns for new features
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS syndicate_join_date DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
-- status values: 'pending' | 'approved' | 'rejected'

-- 4) Invitation requests table
CREATE TABLE IF NOT EXISTS invitation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  specialty TEXT,
  passport_number TEXT,
  conference_id UUID REFERENCES conferences(id),
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE invitation_requests DISABLE ROW LEVEL SECURITY;

-- 5) Membership certificate requests
CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  issued_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE certificate_requests DISABLE ROW LEVEL SECURITY;

-- 6) Member activities table
CREATE TABLE IF NOT EXISTS member_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  doctor_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE member_activities DISABLE ROW LEVEL SECURITY;

-- 7) Add cert_number column to certificate_requests
ALTER TABLE certificate_requests ADD COLUMN IF NOT EXISTS cert_number TEXT;

-- 8) Profile edit requests table
CREATE TABLE IF NOT EXISTS profile_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  requested_changes JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE profile_edit_requests DISABLE ROW LEVEL SECURITY;

-- 9) Add event_type to conferences
ALTER TABLE conferences ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference';
-- event_type values: 'conference' | 'workshop' | 'seminar'

-- 10) Rejection reason column for doctors
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 11) Visible column for members (directory display control)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT TRUE;

-- 12) Update invitation letter text to support workshops
-- (handled in code, no SQL needed)

-- 13) Affiliation column (separate from specialty)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS affiliation TEXT;

-- 14) Backfill missing cert_numbers for existing certificates
UPDATE certificate_requests
SET cert_number = 'FGR-CERT-' || floor(random() * 9000 + 1000)::text || '-2026'
WHERE cert_number IS NULL AND status = 'approved';
