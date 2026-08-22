import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, TrendingUp, ArrowRight, Sparkles, Compass, Zap } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Interest, SeriousnessScore, Match, ProjectType } from '../lib/types';

export function HomeScreen({
  onTabChange,
  onStartAddPeer,
}: {
  onTabChange?: (t: 'circle' | 'chat') => void;
  onStartAddPeer?: (type: ProjectType) => void;
}) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [scores, setScores] = useState<SeriousnessScore[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('interests').select('*').eq('user_id', user.id).then(({ data }) => setInterests(data || []));
    supabase.from('seriousness_scores').select('*').eq('user_id', user.id).then(({ data }) => setScores(data || []));
    supabase.from('matches').select('*').eq('user_id', user.id).then(({ data }) => setMatches(data || []));
  }, [user]);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-surface pb-20">
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <img src="/collzap_color_v1.png" alt="CollZap" className="h-9 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-ink-950">Hey {firstName}!</h1>
        <p className="text-ink-500 text-sm mt-1">Here's what's happening in your circle</p>
      </div>

      <div className="px-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <Users className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{matches.length}</p>
            <p className="text-xs text-ink-300">Matches</p>
          </div>
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <TrendingUp className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{scores.length}</p>
            <p className="text-xs text-ink-300">Scores</p>
          </div>
          <div className="bg-white rounded-card border border-navy-700 shadow-card p-4">
            <Sparkles className="w-5 h-5 text-electric-500 mb-2" />
            <p className="text-2xl font-bold text-ink-950">{interests.length}</p>
            <p className="text-xs text-ink-300">Interests</p>
          </div>
        </div>

        {interests.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-ink-700 mb-3">Your interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((i, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-navy-700 text-ink-700">
                  {i.interest_name}
                  {i.level && ` · ${i.level}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {scores.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-ink-700 mb-3">Your levels</h3>
            <div className="space-y-2">
              {scores.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-btn border border-navy-700 shadow-card px-4 py-3">
                  <span className="text-sm text-ink-700">{s.interest_name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                      <div className="h-full bg-electric-500 rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-electric-500 w-20 text-right">{s.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {matches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-ink-700 mb-3">Recent matches</h3>
            <div className="space-y-2">
              {matches.slice(0, 3).map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => onTabChange ? onTabChange('chat') : navigate('/app/chat')}
                  className="w-full flex items-center justify-between bg-white rounded-btn border border-navy-700 shadow-card px-4 py-3 hover:border-electric-500/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-electric-50 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-electric-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium capitalize text-ink-950">{m.project_type.replace('_', '-')}</p>
                      <p className="text-xs text-ink-300">{m.connection_type} · {m.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-base font-bold text-ink-950 mb-1">Explore More Connections</h3>
          <p className="text-sm text-ink-500 mb-4">Find new peers anytime — your existing matches stay as they are</p>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => onStartAddPeer ? onStartAddPeer('long_term') : navigate('/app/add-peer/long_term')}
              className="w-full text-left rounded-card p-5 border-2 border-navy-700 bg-white hover:border-electric-500 hover:shadow-lg transition-all active:scale-[0.98] shadow-card group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-btn bg-electric-50 flex items-center justify-center shrink-0 group-hover:bg-electric-500 transition-colors">
                  <Compass className="w-7 h-7 text-electric-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink-950">Long-Term Peer</h4>
                  <p className="text-sm text-ink-500 mt-0.5">Pick interests, take the seriousness test, and find a committed peer</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-electric-500 transition-colors shrink-0" />
              </div>
            </button>

            <button
              onClick={() => onStartAddPeer ? onStartAddPeer('short_term') : navigate('/app/add-peer/short_term')}
              className="w-full text-left rounded-card p-5 border-2 border-navy-700 bg-white hover:border-electric-500 hover:shadow-lg transition-all active:scale-[0.98] shadow-card group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-btn bg-electric-50 flex items-center justify-center shrink-0 group-hover:bg-electric-500 transition-colors">
                  <Zap className="w-7 h-7 text-electric-500 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink-950">Short-Term Buddy</h4>
                  <p className="text-sm text-ink-500 mt-0.5">Pick an activity, set your level, and get matched for a quick goal</p>
                </div>
                <ArrowRight className="w-5 h-5 text-ink-300 group-hover:text-electric-500 transition-colors shrink-0" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
