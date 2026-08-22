/*
# Create chat rooms and group chat support

## Overview
Adds chat_rooms and chat_room_members tables to support 1-on-1, short group
(2-4 members), and society (campus-wide) chats. The existing messages table
is extended with an optional chat_room_id so messages can belong to a room.
The matches table gains a chat_room_id column to link a match to its room.

## New Tables
1. **chat_rooms** — id, room_type, project_type, interest_name, connection_type, created_at
2. **chat_room_members** — id, chat_room_id, user_id, joined_at, UNIQUE(chat_room_id, user_id)

## Modified Tables
- matches: add chat_room_id (uuid, nullable, FK to chat_rooms)
- messages: add chat_room_id (uuid, nullable, FK to chat_rooms)

## Security (RLS)
- chat_rooms: members can read their rooms; authenticated can insert.
- chat_room_members: members can read memberships in their rooms; users can insert own row.
- matches: read if owner, matched user, or room member.
- messages: read if sender, receiver, or room member.

## Notes
1. Matching edge function uses service role key (bypasses RLS) to create rooms/matches cross-user.
2. Society rooms auto-join instantly.
3. Short group rooms open at 2 members, accept more up to 4.
*/

-- ============ CHAT_ROOMS ============
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_type text NOT NULL CHECK (room_type IN ('1-on-1', 'short_group', 'society')),
  project_type text NOT NULL CHECK (project_type IN ('long_term', 'short_term')),
  interest_name text NOT NULL,
  connection_type text CHECK (connection_type IN ('1-on-1', 'short_group', 'society')),
  created_at timestamptz DEFAULT now()
);

-- ============ CHAT_ROOM_MEMBERS ============
CREATE TABLE IF NOT EXISTS chat_room_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(chat_room_id, user_id)
);

-- ============ MATCHES: add chat_room_id ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches' AND column_name = 'chat_room_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============ MESSAGES: add chat_room_id ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'chat_room_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN chat_room_id uuid REFERENCES chat_rooms(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============ RLS: CHAT_ROOMS ============
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_member_rooms" ON chat_rooms;
CREATE POLICY "select_member_rooms" ON chat_rooms FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.chat_room_id = chat_rooms.id
      AND chat_room_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_rooms" ON chat_rooms;
CREATE POLICY "insert_rooms" ON chat_rooms FOR INSERT
  TO authenticated WITH CHECK (true);

-- ============ RLS: CHAT_ROOM_MEMBERS ============
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_memberships" ON chat_room_members;
CREATE POLICY "select_own_memberships" ON chat_room_members FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM chat_room_members m2
      WHERE m2.chat_room_id = chat_room_members.chat_room_id
      AND m2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_membership" ON chat_room_members;
CREATE POLICY "insert_own_membership" ON chat_room_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ RLS: MATCHES (updated) ============
DROP POLICY IF EXISTS "select_own_matches" ON matches;
CREATE POLICY "select_own_matches" ON matches FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR auth.uid() = matched_user_id
    OR EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.chat_room_id = matches.chat_room_id
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- ============ RLS: MESSAGES (updated) ============
DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.chat_room_id = messages.chat_room_id
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_room ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_matches_chat_room ON matches(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_interest ON chat_rooms(interest_name);

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
