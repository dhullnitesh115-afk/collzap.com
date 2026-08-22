/**
 * Add Peer Flow
 * -------------
 * A mini onboarding flow for already-onboarded users who want to find new
 * peers. Skips signup and profile (since the user already exists) and goes
 * straight to interests, test, score, connection type, and matching.
 *
 * Used when a user taps "Long-Term Peer" or "Short-Term Buddy" on the Home screen.
 */

import { useState, useEffect } from 'react';
import { useOnboarding } from '../shared/lib/onboarding';
import { InterestSelection } from './InterestSelection';
import { SeriousnessTest } from './SeriousnessTest';
import { ScoreResult } from './ScoreResult';
import { ConnectionType } from './ConnectionType';
import { AutoMatch } from './AutoMatch';
import type { ProjectType } from '../shared/types';

type AddPeerStep = 'interests' | 'seriousness' | 'score' | 'connection' | 'auto_match';

export function AddPeerFlow({
  projectType,
  onComplete,
  onBack,
}: {
  projectType: ProjectType;
  onComplete: (tab?: string, chatRoomId?: string) => void;
  onBack: () => void;
}) {
  const { data, update } = useOnboarding();
  const [step, setStep] = useState<AddPeerStep>('interests');
  const hasLong = data.projectTypes.includes('long_term');

  // Seed the project type and reset per-flow fields on mount
  useEffect(() => {
    update({
      projectTypes: [projectType],
      longTermInterests: [],
      longTermSubTag: '',
      shortTermActivity: '',
      shortTermLevel: 'Beginner',
      scores: [],
      connectionType: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (step) {
    case 'interests':
      return (
        <InterestSelection
          forceProjectType={projectType}
          onBack={onBack}
          onNext={() => setStep(hasLong ? 'seriousness' : 'connection')}
        />
      );
    case 'seriousness':
      return <SeriousnessTest onBack={() => setStep('interests')} onNext={() => setStep('score')} />;
    case 'score':
      return (
        <ScoreResult
          onBack={() => setStep(hasLong ? 'seriousness' : 'interests')}
          onNext={() => setStep('connection')}
        />
      );
    case 'connection':
      return (
        <ConnectionType
          onBack={() => setStep(hasLong ? 'score' : 'interests')}
          onNext={() => setStep('auto_match')}
        />
      );
    case 'auto_match':
      return (
        <AutoMatch
          onChat={(chatRoomId) => onComplete('chat', chatRoomId)}
          onHome={() => onComplete('home')}
          onBack={onBack}
        />
      );
  }
}
