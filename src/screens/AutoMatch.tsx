/**
 * Auto Match Screen
 * ----------------
 * The final step of onboarding (and add-peer flow). Persists all collected
 * data to the database (interests, scores, onboarding completion), then calls
 * the auto-match edge function to find a peer.
 *
 * Shows three phases:
 * 1. Searching — animated loading while the match function runs
 * 2. Found — a match was found, user can open chat
 * 3. Pending — no match yet, polls every 30 seconds
 *
 * Bug fixes applied:
 * - Handles both project types (long_term AND short_term) instead of only the first
 * - Prevents duplicate interest/score inserts by deleting existing rows first
 * - Replaced Hindi text with English
 * - Added error handling for database operations
 */

import { useState, useEffect, useRef } from 'react';
import { Check, Bell, MessageCircle, Zap, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type Phase = 'searching' | 'found' | 'pending';

interface MatchResponse {
  matched: boolean;
  chatRoomId?: string | null;
  matchedUserId?: string;
  interestName?: string;
  connectionType?: string;
  message?: string;
  error?: string;
}

export function AutoMatch({ onChat, onHome, onBack }: { onChat: (chatRoomId?: string) => void; onHome: () => void; onBack?: () => void }) {
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('searching');
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Build a map of interest/activity name → level for the match function. */
  const buildLevelsMap = (): Record<string, string> => {
    const levels: Record<string, string> = {};
    if (data.projectTypes.includes('long_term')) {
      for (const s of data.scores) {
        levels[s.interest] = s.level;
      }
    }
    if (data.projectTypes.includes('short_term') && data.shortTermActivity) {
      levels[data.shortTermActivity] = data.shortTermLevel;
    }
    return levels;
  };

  /** Get all interest/activity names for the selected project types. */
  const getInterests = (): string[] => {
    if (data.projectTypes.includes('long_term')) return data.longTermInterests;
    if (data.projectTypes.includes('short_term') && data.shortTermActivity) return [data.shortTermActivity];
    return [];
  };

  /**
   * Call the auto-match edge function.
   * Sends ALL selected project types (not just the first one) so the server
   * can match on each type independently.
   */
  const callMatchFunction = async (): Promise<MatchResponse> => {
    const interests = getInterests();
    const levels = buildLevelsMap();

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auto-match`;
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        userId: user?.id,
        projectTypes: data.projectTypes,
        connectionType: data.connectionType,
        interests,
        levels,
        collegeName: data.collegeName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Match request failed (${response.status})`);
    }
    const result = await response.json();
    if (result.error) {
      throw new Error(result.error);
    }
    return result as MatchResponse;
  };

  const runMatch = async () => {
    if (!user) return;

    try {
      const result = await callMatchFunction();

      if (result.matched && result.chatRoomId) {
        setChatRoomId(result.chatRoomId);
        setPhase('found');
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } else {
        setPhase('pending');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Matching failed. Will retry.');
      setPhase('pending');
    }
  };

  useEffect(() => {
    if (!user) return;

    /**
     * Persist all onboarding data to the database, then run the match.
     * Prevents duplicate rows by deleting existing interests/scores for
     * this user before inserting new ones.
     */
    const persistAndMatch = async () => {
      setError(null);

      // Mark onboarding as complete
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
      if (profileErr) {
        setError('Failed to save profile. Please try again.');
        setPhase('pending');
        return;
      }

      // Delete existing interests for this user to prevent duplicates
      await supabase.from('interests').delete().eq('user_id', user.id);

      // Insert new interests
      const interestRows: { user_id: string; project_type: 'long_term' | 'short_term'; interest_name: string; sub_tag: string | null; level: string | null }[] = [];
      if (data.projectTypes.includes('long_term')) {
        for (const interest of data.longTermInterests) {
          interestRows.push({
            user_id: user.id,
            project_type: 'long_term',
            interest_name: interest,
            sub_tag: data.longTermSubTag || null,
            level: null,
          });
        }
      }
      if (data.projectTypes.includes('short_term') && data.shortTermActivity) {
        interestRows.push({
          user_id: user.id,
          project_type: 'short_term',
          interest_name: data.shortTermActivity,
          sub_tag: null,
          level: data.shortTermLevel,
        });
      }
      if (interestRows.length > 0) {
        const { error: interestErr } = await supabase.from('interests').insert(interestRows);
        if (interestErr) {
          setError('Failed to save interests. Please try again.');
        }
      }

      // Delete existing scores for this user to prevent duplicates
      await supabase.from('seriousness_scores').delete().eq('user_id', user.id);

      // Insert new scores
      const scoreRows = data.scores.map((s) => ({
        user_id: user.id,
        interest_name: s.interest,
        score: s.score,
        level: s.level,
      }));
      if (scoreRows.length > 0) {
        const { error: scoreErr } = await supabase.from('seriousness_scores').insert(scoreRows);
        if (scoreErr) {
          setError('Failed to save test results. Please try again.');
        }
      }

      await runMatch();
    };

    persistAndMatch();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Start polling every 30 seconds when in pending phase
  useEffect(() => {
    if (phase !== 'pending') return;

    pollRef.current = setInterval(async () => {
      await runMatch();
    }, 30000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleOpenChat = () => {
    onChat(chatRoomId);
  };

  if (phase === 'searching') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-8">
        {onBack && (
          <button onClick={onBack} className="absolute top-5 left-5 text-ink-500 hover:text-ink-950 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full bg-electric-500/10 animate-pulse-ring" />
          <div className="absolute inset-2 rounded-full bg-electric-500/10 animate-pulse-ring" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-4 border-electric-500 border-t-transparent animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 text-ink-950 animate-pulse">Finding your people...</h2>
        <p className="text-ink-500 text-sm text-center max-w-xs">
          We're searching for peers who match your interests, level, and connection preferences
        </p>
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-electric-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'found') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-8 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center mb-6 animate-bounce-in shadow-2xl shadow-electric-500/30">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-ink-950">Match Found!</h2>
        <p className="text-ink-500 text-sm text-center max-w-xs mb-8">
          We found a peer who matches your vibe. Your chat is ready!
        </p>
        <Button size="lg" onClick={handleOpenChat}>
          <MessageCircle className="w-5 h-5 mr-2" />
          Open Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-8 animate-fade-in">
      {onBack && (
        <button onClick={onBack} className="absolute top-5 left-5 text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="w-24 h-24 rounded-full bg-electric-50 flex items-center justify-center mb-6 animate-bounce-in">
        <Bell className="w-12 h-12 text-electric-500" />
      </div>
      <h2 className="text-xl font-bold mb-3 text-center text-ink-950">Match in Progress</h2>
      <p className="text-ink-500 text-sm text-center max-w-xs mb-8 leading-relaxed">
        We're still looking for the perfect peer for you. You'll be notified as soon as a match is found.
      </p>
      {error && (
        <p className="text-red-500 text-xs text-center max-w-xs mb-4">{error}</p>
      )}
      <p className="text-xs text-ink-300 mb-6">Checking every 30 seconds...</p>
      <Button variant="secondary" size="lg" onClick={onHome}>
        <Zap className="w-4 h-4 mr-2" />
        Go to Home
      </Button>
    </div>
  );
}
