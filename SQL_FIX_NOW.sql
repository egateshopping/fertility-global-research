-- ============================================
-- FERTILITY GLOBAL RESEARCH
-- SQL FIX — Run this in Supabase SQL Editor
-- ============================================

-- 1) Make passport_number optional (was blocking registration)
ALTER TABLE doctors ALTER COLUMN passport_number DROP NOT NULL;

-- 2) Add ALL new columns (safe — IF NOT EXISTS skips if already there)
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS clinic_address TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT 'doctor';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS syndicate_id TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS governorate TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS syndicate_join_date DATE;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 3) New tables
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_email TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;

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

CREATE TABLE IF NOT EXISTS certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  issued_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE certificate_requests DISABLE ROW LEVEL SECURITY;

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

-- 4) Fix existing doctors status (approve all current ones)
UPDATE doctors SET status = 'approved' WHERE status IS NULL;

-- Done!
SELECT 'All fixes applied successfully' AS result;
