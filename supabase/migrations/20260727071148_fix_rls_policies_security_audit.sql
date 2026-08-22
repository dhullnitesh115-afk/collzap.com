/*
# Fix RLS policies for otp_codes, chat_rooms, and chat_room_members

## Overview
Tightens row-level security on three tables that had overly permissive policies
flagged by the security audit. All write operations on these tables are
performed by edge functions using the SERVICE ROLE key, which bypasses RLS —
so client-side INSERT/UPDATE/DELETE policies are unnecessary and dangerous.

## Security Changes

### otp_codes
- REMOVED `anon_select_otp_codes` (was USING (true) — anyone could read ALL
  OTP codes for every email, a critical leak).
- REMOVED `anon_insert_otp_codes` (was WITH CHECK (true) — anyone could
  insert a fake code and then self-verify it).
- No client access remains. The send-otp edge function (service role) is
  the only thing that inserts, selects, and updates OTP codes.

### chat_rooms
- REMOVED `insert_rooms` (was WITH CHECK (true) — any authenticated user
  could create arbitrary chat rooms).
- Kept `select_member_rooms` — users can only read rooms they belong to.
- The auto-match edge function (service role) creates all rooms.

### chat_room_members
- REMOVED `insert_own_membership` (was WITH CHECK (auth.uid() = user_id) —
  any user could join ANY room by inserting their own row, since there was
  no check that they were invited).
- Kept `select_own_memberships` — users can only read memberships for
  rooms they already belong to.
- The auto-match edge function (service role) adds all members.

## Important Notes
1. Edge functions use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely,
   so removing client INSERT policies does not affect their operation.
2. Users can still READ the rooms and memberships they belong to, which is
   required for the chat screen to function.
3. No data is lost — only policies are changed.
*/

-- ============ otp_codes: remove all client access ============
DROP POLICY IF EXISTS "anon_select_otp_codes" ON otp_codes;
DROP POLICY IF EXISTS "anon_insert_otp_codes" ON otp_codes;

-- ============ chat_rooms: remove open insert ============
DROP POLICY IF EXISTS "insert_rooms" ON chat_rooms;

-- ============ chat_room_members: remove open self-join ============
DROP POLICY IF EXISTS "insert_own_membership" ON chat_room_members;
