import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, MessageCircle, Link2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { markScreenSeen, hasSeenScreen } from '../lib/seen';
import type { Profile } from '../lib/types';

interface MatchItem {
  matchId: string;
  peerProfile: Profile | null;
  interestName: string;
  level: string | null;
  connectionType: string | null;
  projectType: string;
  status: string;
  chatRoomId: string | null;
  createdAt: string;
}

export function CircleScreen({ onBack, onOpenChat }: { onBack?: () => void; onOpenChat?: (roomId: string) => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(!hasSeenScreen('circle'));

  useEffect(() => {
    if (!user) return;

    const loadMatches = async () => {
      // Get all matches for this user (active or matched)
      const { data: matchRows } = await supabase
        .from('matches')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'matched'])
        .order('created_at', { ascending: false });

      if (!matchRows || matchRows.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get the matched user IDs
      const peerIds = matchRows
        .map((m) => m.matched_user_id)
        .filter((id): id is string => id !== null);

      let peerProfiles: Profile[] = [];
      if (peerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', peerIds);
        peerProfiles = (profiles as Profile[]) || [];
      }

      const profileMap = new Map<string, Profile>();
      peerProfiles.forEach((p) => profileMap.set(p.id, p));

      // For each match, get interest name and level
      const items: MatchItem[] = [];

      for (const m of matchRows) {
        const peer = m.matched_user_id ? profileMap.get(m.matched_user_id) || null : null;

        // Get interest name from chat room if available
        let interestName = '—';
        let level: string | null = null;

        if (m.chat_room_id) {
          const { data: room } = await supabase
            .from('chat_rooms')
            .select('interest_name')
            .eq('id', m.chat_room_id)
            .maybeSingle();
          if (room?.interest_name) interestName = room.interest_name;
        }

        // Get level from seriousness_scores (long_term) or interests (short_term)
        if (m.matched_user_id) {
          if (m.project_type === 'long_term') {
            const { data: score } = await supabase
              .from('seriousness_scores')
              .select('level')
              .eq('user_id', m.matched_user_id)
              .limit(1)
              .maybeSingle();
            level = score?.level || null;
          } else {
            const { data: interest } = await supabase
              .from('interests')
              .select('level')
              .eq('user_id', m.matched_user_id)
              .eq('project_type', 'short_term')
              .limit(1)
              .maybeSingle();
            level = interest?.level || null;
          }
        }

        items.push({
          matchId: m.id,
          peerProfile: peer,
          interestName,
          level,
          connectionType: m.connection_type,
          projectType: m.project_type,
          status: m.status,
          chatRoomId: m.chat_room_id,
          createdAt: m.created_at,
        });
      }

      setMatches(items);
      setLoading(false);
    };

    loadMatches();
  }, [user]);

  const dismissWelcome = () => {
    markScreenSeen('circle');
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-4">
        {onBack && (
          <button onClick={() => onBack()} className="mb-4 text-ink-500 hover:text-ink-950 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-2xl font-bold mb-1 text-ink-950">Your Circle</h1>
        <p className="text-ink-500 text-sm mb-4">Your current matches and connections</p>

        {showWelcome && matches.length > 0 && (
          <div className="bg-electric-50 border border-electric-200 rounded-card p-3 mb-4 flex items-start gap-2 animate-fade-in">
            <Users className="w-4 h-4 text-electric-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-ink-700">These are the peers you've matched with. Tap any match to open your chat.</p>
            </div>
            <button onClick={dismissWelcome} className="text-ink-300 hover:text-ink-500 text-xs">Got it</button>
          </div>
        )}
      </div>

      <div className="px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-electric-500 animate-spin mb-4" />
            <p className="text-sm text-ink-300">Loading your matches...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-card bg-white border border-navy-700 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-ink-300" />
            </div>
            <p className="text-ink-500 text-sm max-w-xs">
              No matches yet. Go to Home and start matching with peers who share your interests!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, idx) => (
              <div
                key={match.matchId}
                className="bg-white rounded-card border border-navy-700 shadow-card p-4 animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-electric-50 border border-navy-700 shrink-0 flex items-center justify-center">
                    {match.peerProfile?.photo_url ? (
                      <img src={match.peerProfile.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : match.connectionType === 'society' || match.connectionType === 'short_group' ? (
                      <Users className="w-6 h-6 text-electric-500" />
                    ) : (
                      <span className="text-lg font-bold text-electric-500">
                        {(match.peerProfile?.full_name || '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-950 truncate">
                      {match.peerProfile?.full_name || (match.connectionType === 'society' ? `${match.interestName} Society` : 'Peer')}
                    </h3>
                    <p className="text-xs text-ink-300 truncate">
                      {match.peerProfile?.college_name || '—'}
                      {match.peerProfile?.year ? ` · ${match.peerProfile.year}` : ''}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-electric-50 text-electric-500 border border-electric-200">
                        {match.interestName}
                      </span>
                      {match.level && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-surface text-ink-500 border border-navy-700">
                          {match.level}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs bg-surface text-ink-500 border border-navy-700 capitalize">
                        {match.connectionType?.replace(/-/g, ' ') || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {match.peerProfile?.story_looking_for && (
                  <p className="text-xs text-ink-500 mt-3 italic border-l-2 border-navy-700 pl-3">
                    "{match.peerProfile.story_looking_for}"
                  </p>
                )}

                {match.chatRoomId && (
                  <button
                    onClick={() => onOpenChat ? onOpenChat(match.chatRoomId!) : navigate(`/app/chat/${match.chatRoomId}`)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-electric-50 text-electric-500 rounded-btn py-2.5 text-sm font-medium hover:bg-electric-100 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Open Chat
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
