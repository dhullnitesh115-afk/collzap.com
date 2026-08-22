import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import { LONG_TERM_INTERESTS, SHORT_TERM_ACTIVITIES } from '../lib/types';
import type { ShortTermLevel } from '../lib/types';

const INTEREST_ICONS: Record<string, string> = {
  Coding: '</>', Startups: '🚀', Design: '🎨', 'Content Creation': '📹',
  'Public Speaking': '🎤', Music: '🎵', Photography: '📷', Finance: '💰',
  Fitness: '💪', 'Exam Prep': '📚', Research: '🔬', Gaming: '🎮',
  'Social Work': '🤝', Acting: '🎭', Writing: '✍️', Dance: '💃',
  'English Speaking': '🗣️', 'Gym Buddy': '🏋️', 'Book Club': '📖',
  'Sports Team': '⚽', 'Side Project': '⚡', 'Skill Sprint': '🏁',
  'Exam Prep Partner': '📝',
};

const LEVELS: { value: ShortTermLevel; desc: string }[] = [
  { value: 'Beginner', desc: 'Just getting started' },
  { value: 'Intermediate', desc: 'Some experience' },
  { value: 'Expert', desc: 'Highly skilled' },
];

export function InterestSelection({ onBack, onNext, forceProjectType }: { onBack?: () => void; onNext?: () => void; forceProjectType?: 'long_term' | 'short_term' }) {
  const { data, update } = useOnboarding();
  const hasLong = forceProjectType ? forceProjectType === 'long_term' : data.projectTypes.includes('long_term');
  const hasShort = forceProjectType ? forceProjectType === 'short_term' : data.projectTypes.includes('short_term');
  const [mode, setMode] = useState<'long_term' | 'short_term'>(forceProjectType || (hasLong ? 'long_term' : 'short_term'));
  const [longSelected, setLongSelected] = useState<string[]>(data.longTermInterests);
  const [subTag, setSubTag] = useState(data.longTermSubTag);
  const [shortActivity, setShortActivity] = useState(data.shortTermActivity);
  const [shortLevel, setShortLevel] = useState<ShortTermLevel>(data.shortTermLevel);
  const shortTermActivity = shortActivity;
  const shortTermLevel = shortLevel;

  const toggleLong = (interest: string) => {
    setLongSelected((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 2) return [prev[1], interest];
      return [...prev, interest];
    });
  };

  const canProceed = mode === 'long_term' ? longSelected.length >= 1 : !!shortActivity && !!shortLevel;

  const handleNext = () => {
    update({
      longTermInterests: longSelected,
      longTermSubTag: subTag,
      shortTermActivity,
      shortTermLevel,
    });
    onNext();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center justify-between p-5">
        <button onClick={onBack} className="text-ink-500 hover:text-ink-950">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {hasLong && hasShort && !forceProjectType && (
          <div className="flex gap-1 bg-white border border-navy-700 rounded-btn p-1">
            <button
              onClick={() => setMode('long_term')}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                mode === 'long_term' ? 'bg-electric-500 text-white' : 'text-ink-500'
              }`}
            >
              Long-Term
            </button>
            <button
              onClick={() => setMode('short_term')}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
                mode === 'short_term' ? 'bg-electric-500 text-white' : 'text-ink-500'
              }`}
            >
              Short-Term
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        {mode === 'long_term' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Pick your interests</h1>
            <p className="text-ink-500 text-sm mb-6">Select up to 2 that you're most serious about</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {LONG_TERM_INTERESTS.map((interest) => {
                const isSelected = longSelected.includes(interest);
                return (
                  <button
                    key={interest}
                    onClick={() => toggleLong(interest)}
                    className={`relative rounded-card p-4 border-2 transition-all active:scale-[0.97] text-left shadow-card ${
                      isSelected
                        ? 'border-electric-500 bg-electric-50'
                        : 'border-navy-700 bg-white hover:border-navy-600'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-electric-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-2">{INTEREST_ICONS[interest]}</div>
                    <p className="text-sm font-medium leading-tight text-ink-950">{interest}</p>
                  </button>
                );
              })}
            </div>

            {longSelected.length > 0 && (
              <div className="animate-slide-up">
                <Input
                  label="Sub-tag (optional)"
                  placeholder="e.g. React, AI/ML, Indie Hacking..."
                  value={subTag}
                  onChange={(e) => setSubTag(e.target.value)}
                />
                <p className="text-xs text-ink-300 mt-1.5">Add a specific area within your interest</p>
              </div>
            )}
          </div>
        )}

        {mode === 'short_term' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Pick an activity</h1>
            <p className="text-ink-500 text-sm mb-6">Choose 1 activity you need a buddy for</p>

            <div className="space-y-3 mb-8">
              {SHORT_TERM_ACTIVITIES.map((activity) => {
                const isSelected = shortActivity === activity;
                return (
                  <button
                    key={activity}
                    onClick={() => setShortActivity(activity)}
                    className={`w-full flex items-center gap-3 rounded-card p-4 border-2 transition-all active:scale-[0.98] text-left shadow-card ${
                      isSelected
                        ? 'border-electric-500 bg-electric-50'
                        : 'border-navy-700 bg-white hover:border-navy-600'
                    }`}
                  >
                    <div className="text-2xl">{INTEREST_ICONS[activity]}</div>
                    <p className="font-medium flex-1 text-ink-950">{activity}</p>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-electric-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {shortActivity && (
              <div className="animate-slide-up">
                <h3 className="text-sm font-medium text-ink-700 mb-3">Your level</h3>
                <div className="space-y-2">
                  {LEVELS.map(({ value, desc }) => {
                    const isSelected = shortLevel === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setShortLevel(value)}
                        className={`w-full flex items-center justify-between rounded-card p-4 border-2 transition-all active:scale-[0.98] text-left shadow-card ${
                          isSelected
                            ? 'border-electric-500 bg-electric-50'
                            : 'border-navy-700 bg-white hover:border-navy-600'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-ink-950">{value}</p>
                          <p className="text-xs text-ink-300">{desc}</p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-electric-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button fullWidth size="lg" onClick={handleNext} disabled={!canProceed}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
