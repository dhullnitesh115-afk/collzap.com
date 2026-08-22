/**
 * Add Peer Flow Route
 * ------------------
 * Wraps the AddPeerFlow component for users who are already onboarded and
 * want to find new peers. Accessed via /app/add-peer/:type where :type is
 * 'long_term' or 'short_term'.
 *
 * Creates a fresh OnboardingProvider so the add-peer flow doesn't interfere
 * with any existing onboarding state.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { OnboardingProvider } from '../shared/lib/onboarding';
import { AddPeerFlow } from '../screens/AddPeerFlow';
import type { ProjectType } from '../shared/types';

export function AddPeerFlowRoute() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  const projectType = (type === 'long_term' || type === 'short_term')
    ? (type as ProjectType)
    : 'long_term';

  return (
    <OnboardingProvider>
      <AddPeerFlow
        projectType={projectType}
        onComplete={(_tab, chatRoomId) => {
          if (chatRoomId) {
            navigate(`/app/chat/${chatRoomId}`);
          } else {
            navigate('/app/home');
          }
        }}
        onBack={() => navigate('/app/home')}
      />
    </OnboardingProvider>
  );
}
