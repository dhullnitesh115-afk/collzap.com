-- ============================================================
-- Fix messages table schema to match the frontend code
-- ============================================================
-- The frontend uses `read_by` (a text[] array) and nullable `match_id`,
-- but the original migration created `read boolean DEFAULT false` and
-- `match_id uuid NOT NULL`. This migration fixes the mismatch.

-- 1. Add the read_by array column (defaulting to an empty array)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by text[] DEFAULT '{}';

-- 2. Migrate data from the old `read` boolean to `read_by`
-- If read was true, add the receiver_id to the read_by array
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read'
  ) THEN
    UPDATE messages
    SET read_by = ARRAY[receiver_id]
    WHERE read = true AND receiver_id IS NOT NULL AND read_by IS NULL;

    -- Drop the old boolean column
    ALTER TABLE messages DROP COLUMN read;
  END IF;
END $$;

-- 3. Make match_id nullable (messages now belong to chat rooms, not matches)
ALTER TABLE messages ALTER COLUMN match_id DROP NOT NULL;

-- ============================================================
-- Create the mark_message_read function
-- ============================================================
-- The frontend calls supabase.rpc('mark_message_read', { msg_id, reader_id })
-- to mark a message as read by appending the reader's ID to the read_by array.

CREATE OR REPLACE FUNCTION mark_message_read(msg_id uuid, reader_id uuid)
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE messages
  SET read_by = ARRAY(
    SELECT DISTINCT unnest(
      CASE
        WHEN read_by IS NULL THEN ARRAY[reader_id]::text[]
        ELSE array_append(read_by, reader_id::text)
      END
    )
  )
  WHERE id = msg_id;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION mark_message_read(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mark_message_read(uuid, uuid) TO authenticated;

-- ============================================================
-- Create user_preferences table
-- ============================================================
-- Stores notification and privacy preferences synced to the database
-- so they persist across devices (previously stored only in localStorage).

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  match_notifications boolean DEFAULT true,
  message_notifications boolean DEFAULT true,
  account_visible boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_preferences" ON user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_preferences" ON user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_preferences" ON user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_preferences" ON user_preferences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Create user_reports table
-- ============================================================
-- Stores reports submitted by users about other users.
-- Previously the report feature was a mock that did nothing.

CREATE TABLE IF NOT EXISTS user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_text text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_reports" ON user_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "insert_own_reports" ON user_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- ============================================================
-- Create support_requests table
-- ============================================================
-- Stores support contact form submissions from users.

CREATE TABLE IF NOT EXISTS support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_support" ON support_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_support" ON support_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Add performance indexes
-- ============================================================

-- Speed up the most common message query: get all messages in a room ordered by time
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_created
  ON messages (chat_room_id, created_at);

-- Speed up chat room membership lookups
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user
  ON chat_room_members (user_id);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_room
  ON chat_room_members (chat_room_id);

-- Speed up match lookups
CREATE INDEX IF NOT EXISTS idx_matches_user_status
  ON matches (user_id, status);

-- Speed up interest lookups
CREATE INDEX IF NOT EXISTS idx_interests_user_project
  ON interests (user_id, project_type);
