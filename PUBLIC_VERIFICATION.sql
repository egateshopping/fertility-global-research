-- ============================================================================
-- Public verification without exposing member data
-- fertility-global.org — project cdhbjunyzrtvfewztohj
--
-- Problem: /verify/[number] and /verify/cert/[number] query the invitations and
-- certificate_requests tables directly. Anonymous visitors have no SELECT on
-- either table, so every QR scan by a conference organiser, embassy or hospital
-- returns "Not Found". Granting those tables to anon would instead publish
-- passport numbers, dates of birth, phones and addresses to anyone who scans.
--
-- Solution: two SECURITY DEFINER functions that return only what a verifier
-- needs. The tables themselves stay closed. Passport numbers are masked to the
-- last four characters — enough for a verifier holding the document to confirm
-- a match, not enough to reconstruct the number.
--
-- Run in Supabase → SQL Editor. Read the whole file before executing.
-- ============================================================================

-- ── 1. Certificate verification ─────────────────────────────────────────────
create or replace function public.verify_certificate(p_number text)
returns table (
  cert_number   text,
  holder_name   text,
  specialty     text,
  affiliation   text,
  issued_date   text,
  valid_until   text,
  is_valid      boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    cr.cert_number,
    d.full_name,
    d.specialty,
    d.affiliation,
    cr.issued_date::text,
    (date_trunc('year', cr.issued_date) + interval '1 year' - interval '1 day')::date::text,
    (current_date <= (date_trunc('year', cr.issued_date) + interval '1 year' - interval '1 day')::date)
  from public.certificate_requests cr
  join public.doctors d on d.id = cr.doctor_id
  where cr.cert_number = trim(p_number)
    and cr.status = 'approved'
  limit 1;
$$;

-- ── 2. Invitation verification ──────────────────────────────────────────────
create or replace function public.verify_invitation(p_number text)
returns table (
  invitation_number   text,
  holder_name         text,
  specialty           text,
  hospital            text,
  nationality         text,
  passport_masked     text,
  issue_date          text,
  travel_date         text,
  status              text,
  conference_title    text,
  conference_location text,
  start_date          text,
  end_date            text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    i.invitation_number,
    d.full_name,
    d.specialty,
    d.hospital,
    d.nationality,
    case
      when d.passport_number is null or length(d.passport_number) < 4 then null
      else repeat('•', greatest(length(d.passport_number) - 4, 0)) || right(d.passport_number, 4)
    end,
    i.issue_date::text,
    i.travel_date::text,
    i.status,
    c.title,
    c.location,
    c.start_date::text,
    c.end_date::text
  from public.invitations i
  join public.doctors d on d.id = i.doctor_id
  left join public.conferences c on c.id = i.conference_id
  where i.invitation_number = trim(p_number)
  limit 1;
$$;

-- ── 3. Execution rights: the functions are public, the tables are not ───────
revoke all on function public.verify_certificate(text) from public;
revoke all on function public.verify_invitation(text)  from public;

grant execute on function public.verify_certificate(text) to anon, authenticated;
grant execute on function public.verify_invitation(text)  to anon, authenticated;

-- ── 4. Verification of this migration ───────────────────────────────────────
-- Expect one row with the correct holder, and an empty result for a wrong one.
-- select * from public.verify_certificate('FGR-CERT-8523-2026');
-- select * from public.verify_certificate('FGR-CERT-0000-2026');
