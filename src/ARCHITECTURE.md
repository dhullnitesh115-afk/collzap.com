# CollZap Architecture

## Overview

CollZap is a single-page React application that uses **client-side routing** (React Router 6) for navigation. The app is organized into feature-based modules with shared infrastructure, making it easy for new developers to find and modify code.

## Routing Architecture

The app uses React Router's `BrowserRouter` with three route guard types:

### Route Guards (`src/routes/guards.tsx`)

1. **PublicRoute** — For unauthenticated users (splash, welcome, login, signup). Redirects authenticated users to the app or onboarding.
2. **OnboardingRoute** — For authenticated users who haven't completed onboarding. Redirects to the app if onboarding is done.
3. **ProtectedRoute** — For authenticated users with completed onboarding. Redirects to login if not signed in, or to onboarding if not complete.

### Route Structure

```
/                        → Splash (public)
/welcome                 → Welcome carousel (public)
/login                   → Login (public-only)
/signup                  → Sign up (public-only)
/onboarding/profile      → Profile setup (onboarding)
/onboarding/project-type → Project type selection (onboarding)
/onboarding/interests    → Interest selection (onboarding)
/onboarding/seriousness  → Seriousness test (onboarding)
/onboarding/score        → Score result (onboarding)
/onboarding/connection   → Connection type (onboarding)
/onboarding/match        → Auto match (onboarding)
/app/home                → Home dashboard (protected)
/app/circle              → Circle/matches (protected)
/app/chat                → Chat list (protected)
/app/chat/:roomId        → Chat room (protected)
/app/profile             → Profile (protected)
/app/add-peer/:type      → Add peer flow (protected)
/admin                   → Admin panel
```

### Key Benefit

With URL-based routing, a browser refresh on `/app/chat/abc123` stays on that chat instead of resetting to the splash screen. Users can bookmark specific pages, and the browser back button works naturally.

## State Management

### AuthProvider (`src/shared/lib/auth.tsx`)

Manages the Supabase session and user profile. Uses `onAuthStateChange` to automatically load the profile when a user signs in. The async work inside the callback is wrapped in an IIFE to avoid deadlocking Supabase's synchronous event processing.

### OnboardingProvider (`src/shared/lib/onboarding.tsx`)

Holds all data collected during the multi-step onboarding flow. This provider stays mounted across the auth state change that happens during signup, preventing data loss when Supabase creates the account mid-flow.

## Data Flow

```
User Action → React Component → Supabase Client → PostgreSQL (with RLS)
                                    ↑
                              Edge Functions (service role, bypass RLS)
                                    ↑
                              External APIs (Resend for email)
```

### Direct Database Access

Most operations (reading profiles, interests, scores, messages) go directly from the frontend to Supabase using the anon key client. RLS policies ensure users can only access their own data.

### Edge Functions

Operations that need to bypass RLS or access external services run as Supabase Edge Functions:

1. **send-otp** — Generates a 6-digit OTP, stores it in the database, and emails it via Resend API.
2. **auto-match** — The matching engine. Finds compatible peers, creates chat rooms, and creates match records. Uses the service role key to create rooms and memberships that the user wouldn't be able to create directly.
3. **admin-manage** — Admin panel operations.

## Security Model

### Row Level Security (RLS)

Every table has RLS enabled. Users can only:
- Read and modify their own profile, interests, and scores
- Read matches where they are the user or the matched user
- Read messages where they are sender, receiver, or a member of the chat room
- Read chat rooms they belong to

### Edge Functions

Edge functions use the service role key, which bypasses RLS. This is necessary for:
- Creating chat rooms (the user can't create rooms directly due to RLS)
- Adding other users as chat room members
- Creating match records for both users

### SECURITY DEFINER Functions

The `mark_message_read` PostgreSQL function is a SECURITY DEFINER function that allows users to mark messages as read by appending their user ID to the `read_by` array. It's granted to the `authenticated` role only.

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` with full name, college, year, city, photo, stories |
| `interests` | User's selected interests with project type and level |
| `seriousness_scores` | Test results: interest, score (0-100), level, answers |
| `matches` | Match records linking two users with status and chat room |
| `chat_rooms` | Room type (1-on-1/group/society), project type, interest |
| `chat_room_members` | Junction table linking users to chat rooms |
| `messages` | Text messages with `read_by` array for read receipts |
| `otp_codes` | Email, 6-digit code, expiry, used flag |
| `user_preferences` | Notification and privacy settings (synced to DB) |
| `user_reports` | User-submitted reports about other users |
| `support_requests` | User-submitted support contact form messages |

## Score Calculation

Score thresholds (per spec):
- **Beginner:** 0-39%
- **Learning:** 40-64%
- **Intermediate:** 65-84%
- **Expert:** 85-100%

The calculation is in `src/shared/types/index.ts` (`scoreToLevel` function) and `src/shared/lib/questions.ts` (`calculateScore` function).

## Real-time Chat

Chat uses Supabase Realtime (Postgres Changes):
- **INSERT** on messages filtered by `chat_room_id` — delivers new messages instantly
- **UPDATE** on messages — updates read receipts when the other person reads

The chat list subscribes to INSERT events on the messages table to refresh the list when new messages arrive across any conversation.

## Adding a New Feature

1. If it needs a new database table, create a migration using the Supabase MCP `apply_migration` tool. Always enable RLS and write 4 CRUD policies.
2. If it needs to bypass RLS, create an edge function using `deploy_edge_function`.
3. Create the screen component in `src/screens/`.
4. Add the route in `src/App.tsx` with the appropriate guard.
5. If the feature needs shared state, add it to an existing context or create a new one in `src/shared/lib/`.
6. Import shared UI components from `src/shared/components/ui.tsx`.
7. Import types from `src/shared/types/index.ts`.
