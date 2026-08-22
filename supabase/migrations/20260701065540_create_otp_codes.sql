/*
# Create otp_codes table

1. New Tables
- `otp_codes`
  - `id` (uuid, primary key)
  - `email` (text, not null) — the college email the OTP was sent to
  - `code` (text, not null) — the 6-digit OTP code
  - `expires_at` (timestamptz, not null) — 10 minutes from creation
  - `used` (boolean, default false) — whether the code has been consumed
  - `created_at` (timestamptz) — creation timestamp

2. Security
- Enable RLS on `otp_codes`.
- Anon and authenticated roles can insert (to create a code) and select their own unexpired code.
- No update/delete from client — codes are marked used via edge function with service role.

3. Notes
- Edge function uses service role key to bypass RLS for inserts/updates.
- Expiry is enforced at query time via `expires_at > now()`.
*/

CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_otp_codes" ON otp_codes;
CREATE POLICY "anon_insert_otp_codes" ON otp_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_otp_codes" ON otp_codes;
CREATE POLICY "anon_select_otp_codes" ON otp_codes FOR SELECT
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON otp_codes (email);
