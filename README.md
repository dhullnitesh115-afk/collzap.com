# CollZap — India's First Campus Peer Matching Platform

CollZap helps college students find serious peers on their own campus. Students verify their college identity, select interests they're serious about, take a seriousness assessment, and get matched with same-campus peers at a similar knowledge level.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite 5
- **Styling:** Tailwind CSS 3 (custom design tokens: electric blue, navy, light grey)
- **Icons:** Lucide React
- **Routing:** React Router 6 (client-side routing with URL-based navigation)
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Email:** Resend API for OTP verification emails

## Getting Started

### Prerequisites

- Node.js 18+
- npm or your preferred package manager

### Installation

```bash
npm install
npm run dev
```

The dev server starts automatically. No need to run `npm run dev` manually.

### Environment Variables

The following are pre-configured in `.env` and the hosted environment:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (safe for frontend)
- `RESEND_API_KEY` — Resend API key for sending OTP emails (server-side only)

### Building

```bash
npm run build
```

## Project Structure

```
src/
├── App.tsx                    # Root component: providers + router setup
├── main.tsx                   # React entry point
├── index.css                  # Global styles + Tailwind directives
├── shared/                    # Cross-feature shared code
│   ├── components/            # Reusable UI components (Button, Card, ErrorBoundary, etc.)
│   ├── lib/                   # Supabase client, auth context, onboarding context, hooks
│   └── types/                 # Shared TypeScript types and constants
├── routes/                    # Route definitions and guards
│   ├── AppLayout.tsx          # Main app layout with bottom nav
│   ├── guards.tsx             # Route guards (Protected, Onboarding, Public)
│   ├── OnboardingRoutes.tsx   # Onboarding step routes
│   └── AddPeerFlowRoute.tsx   # Add peer flow route wrapper
├── screens/                   # All screen components
│   ├── Splash.tsx             # Splash screen
│   ├── Welcome.tsx            # Welcome carousel
│   ├── SignUp.tsx             # Sign up (email OTP or document upload)
│   ├── Login.tsx              # Login
│   ├── ProfileSetup.tsx       # Profile setup (photo, name, stories)
│   ├── ProjectType.tsx        # Long-term or short-term selection
│   ├── InterestSelection.tsx  # Interest/activity selection
│   ├── SeriousnessTest.tsx    # 25-question assessment
│   ├── ScoreResult.tsx        # Score and level display
│   ├── ConnectionType.tsx     # 1-on-1, short group, or society
│   ├── AutoMatch.tsx          # Matching engine + results
│   ├── AddPeerFlow.tsx        # Mini onboarding for existing users
│   ├── HomeScreen.tsx         # Dashboard
│   ├── CircleScreen.tsx       # Match list
│   ├── ChatScreen.tsx         # Chat list + chat room
│   ├── ProfileScreen.tsx      # Profile + settings
│   └── AdminScreen.tsx       # Admin panel
└── lib/                       # Re-export shims for backward compatibility
supabase/
├── migrations/                # SQL migrations
└── functions/                 # Edge functions (Deno)
    ├── send-otp/              # OTP generation and email
    ├── auto-match/            # Peer matching engine
    └── admin-manage/          # Admin operations
```

## App Flow

1. Splash → Welcome carousel → Sign Up (email OTP or document upload)
2. Profile Setup (photo, name, college, year, city, stories, proof of work)
3. Project Type (long-term peer, short-term buddy, or both)
4. Interest Selection (16 long-term interests max 2, or 7 short-term activities)
5. Seriousness Test (25 questions, long-term only)
6. Score Result (Beginner/Learning/Intermediate/Expert)
7. Connection Type (1-on-1, short group, society)
8. Auto Match (finds peers, opens chat or queues)

## Matching Logic

Matches are found by: same college + same interest + similar level (±1 tolerance) + same connection type.

- **1-on-1:** Private chat between 2 matched peers
- **Short Group:** Group chat 2-4 people, opens at 2, adds more automatically
- **Society:** Campus-wide community, auto-join, instant access

If no match is found, the system polls every 30 seconds for new matches.

## Database

All tables have Row Level Security (RLS) enabled. Users can only access their own data. Cross-user operations (matching, chat room creation) are handled by edge functions using the service role key.

See `src/ARCHITECTURE.md` for detailed architecture documentation.
