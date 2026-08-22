import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, User, Users, Building2 } from 'lucide-react';
import { Button } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import type { ConnectionType } from '../lib/types';

const OPTIONS: { value: ConnectionType; icon: typeof User; title: string; desc: string; projectTypes: ('long_term' | 'short_term')[] }[] = [
  {
    value: '1-on-1',
    icon: User,
    title: '1-on-1',
    desc: 'Deep connection with a single peer. Best for focused growth and accountability.',
    projectTypes: ['long_term', 'short_term'],
  },
  {
    value: 'short_group',
    icon: Users,
    title: 'Short Group',
    desc: 'Small group of 3-5 peers. Great for collaborative energy and diverse perspectives.',
    projectTypes: ['long_term', 'short_term'],
  },
  {
    value: 'society',
    icon: Building2,
    title: 'Society',
    desc: 'Join or build a larger community around your shared interest.',
    projectTypes: ['long_term'],
  },
];

const ICON_BLUE = '#3B7EFF';

export function ConnectionType({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const { data, update } = useOnboarding();
  const [selected, setSelected] = useState<ConnectionType | null>(data.connectionType);

  const available = OPTIONS.filter((o) => o.projectTypes.some((pt) => data.projectTypes.includes(pt)));

  const handleNext = () => {
    update({ connectionType: selected });
    onNext();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-5">
        <button onClick={onBack} className="text-ink-500 hover:text-ink-950">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        <h1 className="text-2xl font-bold mb-2 text-ink-950">Connection type</h1>
        <p className="text-ink-500 text-sm mb-8">How do you want to connect with your peers?</p>

        <div className="space-y-3">
          {available.map(({ value, icon: Icon, title, desc }) => {
            const isSelected = selected === value;
            return (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className={`w-full text-left rounded-card p-5 border-2 transition-all active:scale-[0.98] shadow-card ${
                  isSelected
                    ? 'border-electric-500 bg-electric-50'
                    : 'border-navy-700 bg-white hover:border-navy-600'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-btn flex items-center justify-center shrink-0 transition-colors ${
                    isSelected ? 'bg-electric-500' : 'bg-electric-50'
                  }`}>
                    <Icon
                      className="w-8 h-8"
                      strokeWidth={2}
                      color={isSelected ? '#ffffff' : ICON_BLUE}
                    />
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
        <Button fullWidth size="lg" onClick={handleNext} disabled={!selected}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
