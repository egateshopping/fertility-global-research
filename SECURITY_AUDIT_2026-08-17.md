# fertility-global.org — Security & Functional Audit
**Date:** 17 August 2026 | **Auditor:** Claude | **Scope:** MK_UPDATES.zip codebase + live Supabase project `cdhbjunyzrtvfewztohj`
**Nothing was modified.** All database access was read-only inspection.

---

## Executive summary

Good news first: the database is **far more secure than your notes say**. RLS is now enabled on all 10 tables with correct owner/admin policies, the `doctor-documents` bucket is **private** (not public), storage access is scoped per user folder, and there are trigger-level guards preventing a member from self-approving or self-promoting to admin. A hardening migration series was applied on **16 August 2026** (13 migrations, latest `policy_perf_pass_two`).

Bad news: **that hardening was applied to the policies but not to the underlying table GRANTs — and the frontend code in MK_UPDATES.zip predates all of it.** In PostgreSQL, RLS policies only filter rows *after* the role passes the table-level privilege check. The `authenticated` role currently has **no INSERT, UPDATE, or DELETE privilege on any table**, and `anon` has **no SELECT on `doctors`**.

**Consequence: the platform is effectively read-only right now.** No data has changed since 16 Aug 16:42 — consistent with a frozen write path.

| Severity | Count | Nature |
|---|---|---|
| 🔴 Critical | 4 | Write path dead; public directory dead; QR verification dead for guests |
| 🟠 High | 4 | Registration data loss; storage path mismatch; API key exposure risk; vulnerable dependencies |
| 🟡 Medium | 5 | PII over-exposure design; TRUNCATE over-grant; missing security headers; guessable numbers; missing table |

---

## 🔴 CRITICAL

### C1 — Admin dashboard cannot write anything
`authenticated` has no INSERT/UPDATE/DELETE on `doctors`, `conferences`, `invitations`, `certificate_requests`, `documents`, `reports`, `invitation_requests`, `blog_posts`, `speakers`, `member_activities`.

Verified: `has_table_privilege('authenticated','public.doctors','UPDATE') = false`

Every admin action fails with *permission denied for table X*: approving a member, rejecting, editing, deleting, creating a conference, issuing an invitation, issuing a certificate, resolving a report, posting news.

### C2 — Public directories are empty for logged-out visitors
`anon` has no SELECT on `doctors`, even though policy `doctors_public_read` (status='approved' AND visible) permits it. Verified: setting role to `anon` and selecting from `doctors` returns *permission denied*.

The three directory pages (`دليل الأطباء` / `الصيادلة` / `المهن الطبية`) therefore show nothing to the public — the exact opposite of a membership directory's purpose. Logged-in members do see it (they have SELECT), which is why the issue was invisible in your screenshot.

### C3 — QR verification is broken for anyone not logged in
`/verify/[number]` reads `invitations`; `/verify/cert/[number]` reads `certificate_requests`. Both tables give `anon` no SELECT, and their policies only admit admins and the owning member.

A conference organiser, embassy, or hospital scanning the QR code on an invitation or certificate sees "not found". This defeats the entire purpose of the verification feature.

### C4 — Registration silently discards the doctor's profile data
Flow in `LoginPage.jsx`: `signUp()` → upload 3 documents → **INSERT into `doctors`**. That INSERT now fails (no privilege, and no member-level INSERT policy). Meanwhile the new `handle_new_auth_user` trigger already created a stub row with `full_name = split_part(email,'@',1)`.

Result: the account exists, the name is an email prefix, and every professional field is NULL.

**Live evidence — 18 of 68 profiles are stubs**, including the three in your screenshot:
`khayat`, `hamk_84` (all fields NULL, no documents).

This is the same root cause as yesterday's directory display question.

---

## 🟠 HIGH

### H1 — Storage folder key mismatch (member re-uploads fail)
Policy requires the first folder segment to equal `auth.uid()`.
- `LoginPage.jsx` uses `${userId}/...` — **correct** (auth uid)
- `DoctorDashboard.jsx` uses `${doctor.id}/...` — **wrong** (doctors row PK) → upload denied
- Activity images use `activities/${doctor.id}/...` — **wrong** → upload denied

Existing objects: 140 of 142 are under a correct auth-uid folder; **2 are stranded** under a doctors-row-id folder and are now unreadable by their owner and by the admin.

### H2 — `getPublicUrl()` on a private bucket
`DoctorDashboard.getDocUrl()` and `AdminDashboard` line 105 build public URLs. The bucket is private, so these return links that fail with 400. Admin has a `createSignedUrl` fallback (`openSignedFile`) but the inline `url` field is dead. All document viewing must go through `createSignedUrl`.

### H3 — Resend API key would ship in the public JavaScript bundle
`src/utils/notifications.js` line 4 holds a placeholder. **Do not put the real key there.** Vite inlines it into `dist/assets/index-*.js`, which is served publicly — anyone could extract it and send email as `contact@fertility-global.org`, which is both a spoofing and a domain-reputation risk. The key must live server-side (Supabase Edge Function or Netlify Function) with the browser calling that endpoint.

### H4 — Vulnerable dependencies
`npm audit`: 1 critical, 1 high, 1 moderate.
- `jspdf ≤ 4.2.0` → bundles vulnerable `dompurify` (multiple XSS advisories). Fix: upgrade to `jspdf@4.2.1` (breaking change — PDF generators need retesting).
- `xlsx@0.18.5` → prototype pollution + ReDoS, **no npm fix available**. Used only in admin export. Options: install the vendor build from the SheetJS CDN, or migrate export to `exceljs`.

---

## 🟡 MEDIUM

### M1 — Directory queries return every PII column
`DoctorDirectory` calls `select('*')`, which includes `passport_number`, `date_of_birth`, `phone`, `address`, `email`. Today `anon` can't read the table at all (C2), so nothing leaks — **but the obvious fix for C2 (`GRANT SELECT ON doctors TO anon`) would expose all of it to the public API.** Fix C2 with a restricted view instead, never a blanket grant. Same principle for the verify pages, which use `select('*, doctors(*)')`.

### M2 — TRUNCATE granted to `anon` and `authenticated` on `doctors`
`has_table_privilege('anon','public.doctors','TRUNCATE') = true`. TRUNCATE **bypasses RLS entirely**. PostgREST does not expose TRUNCATE, so it is not reachable today, but it should be revoked as defence in depth.

### M3 — No security headers
`netlify.toml` sets only the SPA redirect. Missing CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

### M4 — Guessable document numbers
Invitations: timestamp + 2 random digits. Certificates: `Math.floor(1000 + Math.random()*9000)` — **only 9,000 possible values per year**, and `Math.random()` is not cryptographically secure. With ~26 certificates issued, an attacker enumerating 9,000 numbers finds real records quickly. Use `crypto.getRandomValues()` with at least 8 characters, or a DB-side generator.

### M5 — `NewsActivitiesPage` queries a non-existent table
The page reads/writes `activities`; the schema has `member_activities`. The news page will always be empty and admin posting always fails.

### M6 — Minor: root admin email in the client bundle
`ADMIN_EMAILS = ['egate.shopping@gmail.com']` in `App.jsx` line 17. Not a privilege escalation — the DB enforces `is_admin()` — but it names the highest-value account for attackers. Rely on the `is_admin` DB flag alone.

---

## What is working well

- RLS enabled on all 10 public tables with owner-scoped and admin-scoped policies
- `is_admin()`, `handle_new_auth_user()`, `guard_doctor_privilege_columns()` all SECURITY DEFINER with pinned `search_path` — correctly written
- Trigger blocks members changing their own `status`, `visible`, `is_admin`, or `user_id`
- `doctor-documents` bucket is private with per-user folder scoping and admin-only delete
- `pending_applications` view uses `security_invoker=true` (respects RLS)
- No `dangerouslySetInnerHTML`, no `eval`, no XSS sinks
- Build compiles clean (529 modules)
- All 68 auth users confirmed; no orphaned profiles

---

## Remediation plan (in order)

### Step 1 — Restore the write path (SQL, needs your approval)

```sql
-- Admin + member writes. RLS policies already restrict WHO and WHICH ROWS.
GRANT INSERT, UPDATE, DELETE ON public.doctors              TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.conferences          TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.invitations          TO authenticated;
GRANT        UPDATE, DELETE ON public.certificate_requests  TO authenticated;
GRANT        UPDATE, DELETE ON public.documents             TO authenticated;
GRANT        UPDATE, DELETE ON public.reports               TO authenticated;
GRANT        UPDATE, DELETE ON public.invitation_requests   TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts           TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.speakers             TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.member_activities    TO authenticated;

-- Remove the RLS-bypassing privilege
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- A member may not INSERT a profile row (the signup trigger creates it),
-- so registration must UPDATE its own row. Policy doctors_member_update
-- already allows it and the guard trigger blocks privileged columns.
```

### Step 2 — Public directory without PII (SQL + code)

```sql
CREATE OR REPLACE VIEW public.directory
WITH (security_invoker = true) AS
SELECT id, full_name, profession, specialty, hospital, affiliation,
       nationality, city, governorate, fertility_specialist, profile_photo_url
FROM public.doctors
WHERE status = 'approved' AND visible;

GRANT SELECT ON public.directory TO anon, authenticated;
```
Then change `DoctorDirectory` to `from('directory')` — no `passport_number` reachable from the browser, ever.

### Step 3 — Public verification without PII (SQL + code)
A `SECURITY DEFINER` function returning only: holder name, number, conference title, dates, validity status. Grant EXECUTE to `anon`. Verify pages call `supabase.rpc('verify_invitation', { number })` instead of selecting the tables. Add a rate limit consideration given M4.

### Step 4 — Code fixes (I build, you push)
1. `LoginPage.jsx` step 3: INSERT → UPDATE on own row; surface any error instead of proceeding
2. `DoctorDashboard.jsx`: folder key `doctor.id` → `auth.uid()`; activities path → `${uid}/activities/...`
3. All document viewing → `createSignedUrl` (drop `getPublicUrl`)
4. Directory + verify pages → new view / RPC, explicit column lists
5. `NewsActivitiesPage.jsx`: `activities` → `member_activities`
6. Certificate/invitation numbers → `crypto.getRandomValues()`
7. Remove `ADMIN_EMAILS` client gate
8. `netlify.toml`: add security headers

### Step 5 — Data repair
- Contact or purge the 18 stub profiles (no documents, email-prefix names) — they are abandoned or broken signups
- Re-path the 2 stranded storage objects, or have those two members re-upload
- Fix `ALI DIYAA ZUHAIR` (Bachelor's in the specialty field)
- Collect documents from the 3 members who have none

### Step 6 — Infrastructure
- Resend key → Edge Function, never the bundle
- `jspdf` → 4.2.1, retest all PDF output; replace or vendor `xlsx`
- Confirm email confirmation is ON in Supabase → Authentication

---

## Note on the frozen writes

If members registered or admin approvals happened after 16 Aug 16:42 and appeared to work, tell me — that would mean writes are reaching the DB by a path I have not accounted for, and I should re-check. Otherwise the grant gap above is the whole story, and Step 1 unblocks the platform.
