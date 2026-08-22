/**
 * Shared Type Definitions
 * -----------------------
 * All TypeScript types, enums, and constants used across the app.
 * Any component or hook that needs a type should import from here.
 */

export type ProjectType = 'long_term' | 'short_term';
export type ConnectionType = '1-on-1' | 'short_group' | 'society';
export type MatchStatus = 'pending' | 'matched' | 'active';
export type Level = 'Beginner' | 'Learning' | 'Intermediate' | 'Expert';
export type ShortTermLevel = 'Beginner' | 'Intermediate' | 'Expert';

/** A user's profile row — extends auth.users with app-specific data. */
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  college_name: string | null;
  year: string | null;
  city: string | null;
  photo_url: string | null;
  verification_method: string;
  verification_doc_url: string | null;
  story_achievement: string | null;
  story_serious: string | null;
  story_looking_for: string | null;
  proof_of_work_link: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** A user's selected interest or activity. */
export interface Interest {
  id: string;
  user_id: string;
  project_type: ProjectType;
  interest_name: string;
  sub_tag: string | null;
  level: ShortTermLevel | null;
  created_at: string;
}

/** Result of the 25-question seriousness assessment for one interest. */
export interface SeriousnessScore {
  id: string;
  user_id: string;
  interest_name: string;
  score: number;
  level: Level;
  answers: { question: string; answer: string }[];
  taken_at: string;
}

/** A match record linking two users (or a user to a society room). */
export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string | null;
  project_type: ProjectType;
  connection_type: ConnectionType | null;
  status: MatchStatus;
  chat_room_id: string | null;
  created_at: string;
}

/** A chat room — 1-on-1, short group, or society. */
export interface ChatRoom {
  id: string;
  room_type: ConnectionType;
  project_type: ProjectType;
  interest_name: string | null;
  connection_type: ConnectionType | null;
  created_at: string;
}

/** Membership link between a user and a chat room. */
export interface ChatRoomMember {
  id: string;
  chat_room_id: string;
  user_id: string;
  joined_at: string;
}

/** A text message in a chat room. read_by stores user IDs who have read it. */
export interface Message {
  id: string;
  match_id: string | null;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  read_by: string[];
  chat_room_id: string | null;
  created_at: string;
}

/** User preferences synced to the database (notifications, visibility). */
export interface UserPreferences {
  user_id: string;
  match_notifications: boolean;
  message_notifications: boolean;
  account_visible: boolean;
  updated_at: string;
}

/** The 16 long-term interests a user can pick from (max 2). */
export const LONG_TERM_INTERESTS = [
  'Coding', 'Startups', 'Design', 'Content Creation',
  'Public Speaking', 'Music', 'Photography', 'Finance',
  'Fitness', 'Exam Prep', 'Research', 'Gaming',
  'Social Work', 'Acting', 'Writing', 'Dance',
] as const;

/** The 7 short-term activities a user can pick from (1 only). */
export const SHORT_TERM_ACTIVITIES = [
  'English Speaking', 'Gym Buddy', 'Book Club', 'Sports Team',
  'Side Project', 'Skill Sprint', 'Exam Prep Partner',
] as const;

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

export const STORY_PROMPTS = [
  'One thing I want to achieve in my college years',
  'I am most serious about',
  'The kind of peer I am looking for',
] as const;

/**
 * Map a numeric score (0-100) to a level label.
 * Thresholds per the CollZap spec:
 *   Beginner:     0-39%
 *   Learning:    40-64%
 *   Intermediate: 65-84%
 *   Expert:      85-100%
 */
export function scoreToLevel(score: number): Level {
  if (score < 40) return 'Beginner';
  if (score < 65) return 'Learning';
  if (score < 85) return 'Intermediate';
  return 'Expert';
}
