import { useState } from 'react';
import { ArrowLeft, ArrowRight, Users, Zap, Check } from 'lucide-react';
import { Button } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import type { ProjectType } from '../lib/types';

export function ProjectType({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<ProjectType[]>(data.projectTypes);

  const toggle = (type: ProjectType) => {
    setSelected((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleNext = () => {
    update({ projectTypes: selected });
    onNext();
  };

  const cards: { type: ProjectType; icon: typeof Users; title: string; desc: string }[] = [
    {
      type: 'long_term',
      icon: Users,
      title: 'Long-Term Peer',
      desc: 'Find someone committed to growing with you over months. Take the seriousness test and match at your level.',
    },
    {
      type: 'short_term',
      icon: Zap,
      title: 'Short-Term Buddy',
      desc: 'Need a gym partner, study buddy, or project collaborator right now? Quick matches for immediate goals.',
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-5">
        <button onClick={onBack} className="text-ink-500 hover:text-ink-950">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        <h1 className="text-2xl font-bold mb-2 text-ink-950">What are you looking for?</h1>
        <p className="text-ink-500 text-sm mb-8">Select one or both — you can always change later</p>

        <div className="space-y-4">
          {cards.map(({ type, icon: Icon, title, desc }) => {
            const isSelected = selected.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggle(type)}
                className={`w-full text-left rounded-card p-5 border-2 transition-all active:scale-[0.98] shadow-card ${
                  isSelected
                    ? 'border-electric-500 bg-electric-50'
                    : 'border-navy-700 bg-white hover:border-navy-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-btn flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-electric-500' : 'bg-surface'
                  }`}>
                    <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg text-ink-950">{title}</h3>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-electric-500 flex items-center justify-center animate-bounce-in">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-ink-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="px-6 pb-8 pt-4">
        <Button fullWidth size="lg" onClick={handleNext} disabled={selected.length === 0}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
