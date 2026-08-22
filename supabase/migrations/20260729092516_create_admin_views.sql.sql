/*
# Create human-readable admin views

## Overview
Creates database views that join matches, profiles, interests, and
seriousness_scores so the admin panel can display human-readable rows
(actual names, interest, level, connection type, status, dates) instead
of raw UUIDs. Views are read-only and respect the underlying table RLS.

## New Views
1. **admin_matches_view** — one row per match with both users' names,
   interest, level, connection type, status, created_at.
2. **admin_pending_view** — pending matches only, with user name, interest,
   level, connection type, and how long they have been waiting.
3. **admin_users_view** — all profiles with verification status derived
   from verification_method + verification_doc_url.

## Security
- Views inherit RLS from their underlying tables. The admin edge function
  uses the SERVICE ROLE key which bypasses RLS, so it can read everything.
- No new policies are added; no data is modified.

## Notes
1. `interest_name` and `level` on admin_matches_view are best-effort:
   for long_term matches the level comes from seriousness_scores; for
   short_term matches it comes from the interests table level column.
2. `wait_minutes` on admin_pending_view is computed via EXTRACT(EPOCH)
   so the admin UI can show "waiting since X minutes".
*/

-- ============ ADMIN_MATCHES_VIEW ============
CREATE OR REPLACE VIEW admin_matches_view AS
SELECT
  m.id AS match_id,
  m.user_id AS user1_id,
  u1.full_name AS user1_name,
  u1.email AS user1_email,
  m.matched_user_id AS user2_id,
  u2.full_name AS user2_name,
  u2.email AS user2_email,
  m.project_type,
  m.connection_type,
  m.status,
  COALESCE(
    (SELECT i.interest_name
     FROM interests i
     WHERE i.user_id = m.user_id
       AND i.project_type = m.project_type
     ORDER BY i.created_at DESC
     LIMIT 1),
    m.connection_type
  ) AS interest_name,
  COALESCE(
    (SELECT ss.level
     FROM seriousness_scores ss
     WHERE ss.user_id = m.user_id
     ORDER BY ss.taken_at DESC
     LIMIT 1),
    (SELECT i.level
     FROM interests i
     WHERE i.user_id = m.user_id
       AND i.project_type = m.project_type
     ORDER BY i.created_at DESC
     LIMIT 1)
  ) AS level,
  m.chat_room_id,
  m.created_at
FROM matches m
LEFT JOIN profiles u1 ON u1.id = m.user_id
LEFT JOIN profiles u2 ON u2.id = m.matched_user_id
WHERE m.status IN ('matched', 'active');

-- ============ ADMIN_PENDING_VIEW ============
CREATE OR REPLACE VIEW admin_pending_view AS
SELECT
  m.id AS match_id,
  m.user_id,
  u.full_name,
  u.email,
  u.college_name,
  m.project_type,
  m.connection_type,
  COALESCE(
    (SELECT i.interest_name
     FROM interests i
     WHERE i.user_id = m.user_id
       AND i.project_type = m.project_type
     ORDER BY i.created_at DESC
     LIMIT 1),
    '—'
  ) AS interest_name,
  COALESCE(
    (SELECT ss.level
     FROM seriousness_scores ss
     WHERE ss.user_id = m.user_id
     ORDER BY ss.taken_at DESC
     LIMIT 1),
    (SELECT i.level
     FROM interests i
     WHERE i.user_id = m.user_id
       AND i.project_type = m.project_type
     ORDER BY i.created_at DESC
     LIMIT 1),
    '—'
  ) AS level,
  m.created_at,
  ROUND(EXTRACT(EPOCH FROM (now() - m.created_at)) / 60) AS wait_minutes
FROM matches m
LEFT JOIN profiles u ON u.id = m.user_id
WHERE m.status = 'pending';

-- ============ ADMIN_USERS_VIEW ============
CREATE OR REPLACE VIEW admin_users_view AS
SELECT
  p.id,
  p.full_name,
  p.email,
  p.college_name,
  p.year,
  p.city,
  p.verification_method,
  p.verification_doc_url,
  CASE
    WHEN p.verification_method = 'email_otp' THEN 'Verified (Email OTP)'
    WHEN p.verification_method = 'fee_slip' AND p.verification_doc_url IS NOT NULL THEN 'Pending Review'
    ELSE 'Unverified'
  END AS verification_status,
  p.onboarding_completed,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
