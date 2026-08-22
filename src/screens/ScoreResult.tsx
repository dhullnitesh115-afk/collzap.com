import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';

const LEVEL_MESSAGES: Record<string, string> = {
  Beginner: 'You\'re just getting started — and that\'s exciting! We\'ll match you with peers who are also beginning their journey and mentors who can guide you.',
  Learning: 'You\'re building momentum! Your consistency is growing and you\'re ready for peers who\'ll push you to the next level.',
  Intermediate: 'You\'re committed and capable. We\'ll match you with peers at your level so you can grow together and tackle bigger challenges.',
  Expert: 'You\'re a serious player. We\'ll connect you with other high-level peers and opportunities to lead, mentor, and collaborate on ambitious projects.',
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: '#5C9AFF',
  Learning: '#3B7EFF',
  Intermediate: '#2D63CC',
  Expert: '#1F4A99',
};

export function ScoreResult({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const { data } = useOnboarding();
  const scores = data.scores;
  const [animatedScores, setAnimatedScores] = useState<number[]>(scores.map(() => 0));

  useEffect(() => {
    const timers = scores.map((s, i) =>
      setTimeout(() => {
        setAnimatedScores((prev) => {
          const next = [...prev];
          next[i] = s.score;
          return next;
        });
      }, 300 + i * 400)
    );
    return () => timers.forEach(clearTimeout);
  }, [scores]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-5">
        {onBack && (
          <button onClick={onBack} className="text-ink-500 hover:text-ink-950 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-electric-50 text-electric-500 px-3 py-1 rounded-full text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Your Results
          </div>
          <h1 className="text-2xl font-bold text-ink-950">Here's your seriousness profile</h1>
        </div>

        <div className="space-y-6 mb-8">
          {scores.map((s, i) => {
            const color = LEVEL_COLORS[s.level] || '#3B7EFF';
            const animatedScore = animatedScores[i];
            const circumference = 2 * Math.PI * 52;
            const offset = circumference - (animatedScore / 100) * circumference;
            return (
              <div key={i} className="bg-white rounded-card border border-navy-700 shadow-card p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-center gap-5">
                  <div className="relative w-32 h-32 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-ink-950">{animatedScore}</span>
                      <span className="text-xs text-ink-300">/ 100</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink-500 mb-1">{s.interest}</p>
                    <p className="text-xl font-bold" style={{ color }}>{s.level}</p>
                    <p className="text-xs text-ink-500 mt-2 leading-relaxed">{LEVEL_MESSAGES[s.level]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-card border border-navy-700 shadow-card p-4 mb-6">
          <p className="text-xs text-ink-300 mb-3 font-medium uppercase tracking-wide">Interest Level Tags</p>
          <div className="flex flex-wrap gap-2">
            {scores.map((s, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-full text-xs font-medium border"
                style={{
                  borderColor: LEVEL_COLORS[s.level] + '40',
                  backgroundColor: LEVEL_COLORS[s.level] + '15',
                  color: LEVEL_COLORS[s.level],
                }}
              >
                {s.interest} · {s.level}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button fullWidth size="lg" onClick={onNext}>
          Find My Peers
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <button className="w-full text-center text-xs text-ink-300 mt-4 flex items-center justify-center gap-1.5">
          <RotateCcw className="w-3 h-3" /> Retake in 30 days
        </button>
      </div>
    </div>
  );
}
