import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button, ProgressBar } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { getQuestionsForInterests, calculateScore } from '../lib/questions';
import type { Level } from '../lib/types';

type Phase = 'test' | 'divider' | 'loading';

export function SeriousnessTest({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const { data, update } = useOnboarding();
  const { user } = useAuth();
  const interests = data.longTermInterests;
  const questionSets = useMemo(() => getQuestionsForInterests(interests.length), [interests.length]);
  const [interestIdx, setInterestIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [allScores, setAllScores] = useState<{ interest: string; score: number; level: Level }[]>([]);
  const [phase, setPhase] = useState<Phase>('test');

  const currentInterest = interests[interestIdx];
  const currentQuestions = questionSets[interestIdx] || [];
  const totalQs = currentQuestions.length;
  const totalGlobal = questionSets.reduce((sum, q) => sum + q.length, 0);
  const question = currentQuestions[qIdx];
  const isLast = qIdx === totalQs - 1;
  const answeredBefore = questionSets.slice(0, interestIdx).reduce((sum, q) => sum + q.length, 0);
  const globalProgress = ((answeredBefore + qIdx + 1) / totalGlobal) * 100;

  const selectAnswer = (optionIdx: number) => {
    setSelected(optionIdx);
  };

  const handleNext = () => {
    if (selected === null) return;

    const next = [...answers, selected];
    setAnswers(next);

    if (!isLast) {
      setQIdx(qIdx + 1);
      setSelected(null);
      return;
    }

    const { score, level } = calculateScore(next, totalQs);
    const newScore = { interest: currentInterest, score, level };
    const updated = [...allScores, newScore];
    setAllScores(updated);

    if (user) {
      supabase.from('seriousness_scores').insert({
        user_id: user.id,
        interest_name: currentInterest,
        score,
        level,
        answers: next.map((a, i) => ({ question: currentQuestions[i].q, answer: currentQuestions[i].options[a].text })),
      }).then(() => {});
    }

    if (interestIdx < interests.length - 1) {
      setPhase('divider');
    } else {
      update({ scores: updated });
      setPhase('loading');
    }
  };

  useEffect(() => {
    if (phase === 'divider') {
      const t = setTimeout(() => {
        setInterestIdx(interestIdx + 1);
        setQIdx(0);
        setAnswers([]);
        setSelected(null);
        setPhase('test');
      }, 2500);
      return () => clearTimeout(t);
    }
    if (phase === 'loading') {
      const t = setTimeout(() => onNext(), 3000);
      return () => clearTimeout(t);
    }
  }, [phase, interestIdx, onNext]);

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-8">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-navy-700" />
          <div className="absolute inset-0 rounded-full border-4 border-electric-500 border-t-transparent animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-electric-500 animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold mb-2 text-ink-950 animate-pulse">Finding your level...</h2>
        <p className="text-ink-500 text-sm text-center">Analyzing your responses to determine your seriousness level</p>
      </div>
    );
  }

  if (phase === 'divider') {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-8 animate-fade-in">
        <div className="w-20 h-20 rounded-card bg-gradient-to-br from-electric-500 to-electric-700 flex items-center justify-center mb-6 animate-bounce-in">
          <span className="text-3xl font-bold text-white">{interestIdx + 1}</span>
        </div>
        <h2 className="text-xl font-bold mb-2 text-ink-950">Done with {currentInterest}!</h2>
        <p className="text-ink-500 text-center">
          {interestIdx < interests.length - 1
            ? `Next up: ${interests[interestIdx + 1]}`
            : 'Calculating your results...'}
        </p>
        <div className="mt-6 flex gap-2">
          {interests.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i <= interestIdx ? 'w-8 bg-electric-500' : 'w-2 bg-navy-700'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="flex items-center justify-between p-5">
        <button onClick={onBack} className="text-ink-500 hover:text-ink-950">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-ink-500">{currentInterest}</span>
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-ink-500">Question {qIdx + 1} of {totalQs}</span>
          <span className="text-sm text-electric-500">{Math.round(globalProgress)}%</span>
        </div>
        <ProgressBar value={globalProgress} />
      </div>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        <div key={qIdx} className="animate-slide-in">
          <h2 className="text-xl font-bold leading-snug mb-6 text-ink-950">{question.q}</h2>
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const isSelected = selected === i;
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`w-full text-left rounded-card p-4 border-2 transition-all active:scale-[0.98] shadow-card ${
                    isSelected
                      ? 'border-electric-500 bg-electric-50'
                      : 'border-navy-700 bg-white hover:border-navy-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm leading-relaxed text-ink-700">{opt.text}</p>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-electric-500 flex items-center justify-center shrink-0 ml-3 animate-bounce-in">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-4">
        <Button
          fullWidth
          size="lg"
          onClick={handleNext}
          disabled={selected === null}
          className="mb-4"
        >
          {isLast ? 'See My Results' : 'Next'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <div className="flex gap-1.5 justify-center">
          {currentQuestions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < qIdx ? 'w-4 bg-electric-500' : i === qIdx ? 'w-6 bg-electric-400' : 'w-1.5 bg-navy-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
