/*
# CollZap — Campus Peer Matching Platform Schema

## Overview
Creates the full database schema for CollZap, a campus-based peer matching
platform for Indian college students. The app uses Supabase email/password
authentication, so all tables are owner-scoped with RLS policies.

## New Tables

1. **profiles** — extends auth.users with onboarding/profile data
   - `id` (uuid, PK, FK to auth.users)
   - `email` (text)
   - `full_name` (text)
   - `college_name` (text)
   - `year` (text — 1st/2nd/3rd/4th)
   - `city` (text)
   - `photo_url` (text)
   - `verification_method` (text — 'email_otp' or 'fee_slip')
   - `verification_doc_url` (text — for fee slip/ID card uploads)
   - `story_achievement` (text — max 100 chars)
   - `story_serious` (text — max 100 chars)
   - `story_looking_for` (text — max 100 chars)
   - `proof_of_work_link` (text — optional)
   - `onboarding_completed` (boolean, default false)
   - `created_at`, `updated_at` (timestamps)

2. **interests** — stores selected interests per user
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to profiles, DEFAULT auth.uid())
   - `project_type` (text — 'long_term' or 'short_term')
   - `interest_name` (text — e.g. 'Coding', 'English Speaking')
   - `sub_tag` (text — optional sub-tag text)
   - `level` (text — for short-term: 'Beginner'/'Intermediate'/'Expert')
   - `created_at` (timestamp)

3. **seriousness_scores** — stores seriousness test results
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to profiles, DEFAULT auth.uid())
   - `interest_name` (text)
   - `score` (integer — 0-100)
   - `level` (text — 'Beginner'/'Learning'/'Intermediate'/'Expert')
   - `answers` (jsonb — array of {question, answer} objects)
   - `taken_at` (timestamp)

4. **matches** — stores peer match records
   - `id` (uuid, PK)
   - `user_id` (uuid, FK to profiles, DEFAULT auth.uid())
   - `matched_user_id` (uuid, FK to profiles)
   - `project_type` (text — 'long_term' or 'short_term')
   - `connection_type` (text — '1-on-1', 'short_group', 'society')
   - `status` (text — 'pending', 'matched', 'active')
   - `created_at` (timestamp)

5. **messages** — real-time chat messages
   - `id` (uuid, PK)
   - `match_id` (uuid, FK to matches)
   - `sender_id` (uuid, FK to profiles)
   - `receiver_id` (uuid, FK to profiles)
   - `content` (text)
   - `read` (boolean, default false)
   - `created_at` (timestamp)

## Security (RLS)
- All tables have RLS enabled.
- profiles: users can CRUD their own profile row (id = auth.uid()).
- interests: owner-scoped CRUD via user_id.
- seriousness_scores: owner-scoped CRUD via user_id.
- matches: owner-scoped — users see matches they own OR where they are the matched_user.
- messages: users can read/send messages where they are sender or receiver.

## Important Notes
1. Owner columns default to `auth.uid()` so frontend inserts that omit
   `user_id` still satisfy the INSERT WITH CHECK policy.
2. Real-time is enabled on the `messages` table for live chat.
3. All policies are scoped to `authenticated` since this app requires sign-in.
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  college_name text,
  year text,
  city text,
  photo_url text,
  verification_method text DEFAULT 'email_otp',
  verification_doc_url text,
  story_achievement text CHECK (char_length(story_achievement) <= 100),
  story_serious text CHECK (char_length(story_serious) <= 100),
  story_looking_for text CHECK (char_length(story_looking_for) <= 100),
  proof_of_work_link text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ INTERESTS ============
CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  project_type text NOT NULL CHECK (project_type IN ('long_term', 'short_term')),
  interest_name text NOT NULL,
  sub_tag text,
  level text CHECK (level IN ('Beginner', 'Intermediate', 'Expert')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_interests" ON interests;
CREATE POLICY "select_own_interests" ON interests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_interests" ON interests;
CREATE POLICY "insert_own_interests" ON interests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_interests" ON interests;
CREATE POLICY "update_own_interests" ON interests FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_interests" ON interests;
CREATE POLICY "delete_own_interests" ON interests FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ SERIOUSNESS_SCORES ============
CREATE TABLE IF NOT EXISTS seriousness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  interest_name text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'Beginner',
  answers jsonb DEFAULT '[]'::jsonb,
  taken_at timestamptz DEFAULT now()
);

ALTER TABLE seriousness_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scores" ON seriousness_scores;
CREATE POLICY "select_own_scores" ON seriousness_scores FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scores" ON seriousness_scores;
CREATE POLICY "insert_own_scores" ON seriousness_scores FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_scores" ON seriousness_scores;
CREATE POLICY "update_own_scores" ON seriousness_scores FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_scores" ON seriousness_scores;
CREATE POLICY "delete_own_scores" ON seriousness_scores FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ MATCHES ============
CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  project_type text NOT NULL CHECK (project_type IN ('long_term', 'short_term')),
  connection_type text CHECK (connection_type IN ('1-on-1', 'short_group', 'society')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'active')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_matches" ON matches;
CREATE POLICY "select_own_matches" ON matches FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

DROP POLICY IF EXISTS "insert_own_matches" ON matches;
CREATE POLICY "insert_own_matches" ON matches FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_matches" ON matches;
CREATE POLICY "update_own_matches" ON matches FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_matches" ON matches;
CREATE POLICY "delete_own_matches" ON matches FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ MESSAGES ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_interests_user_id ON interests(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON seriousness_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_id ON matches(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_matched_user_id ON matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
