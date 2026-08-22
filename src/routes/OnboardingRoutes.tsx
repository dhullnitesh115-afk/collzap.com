/**
 * Onboarding Routes
 * -----------------
 * Maps onboarding step URLs to their screen components.
 * Each screen receives onBack/onNext callbacks that use React Router's
 * useNavigate for proper client-side navigation (no full page reload).
 *
 * Route order mirrors the app flow:
 *   /onboarding/profile        → ProfileSetup
 *   /onboarding/project-type   → ProjectType
 *   /onboarding/interests      → InterestSelection
 *   /onboarding/seriousness    → SeriousnessTest (long-term only)
 *   /onboarding/score          → ScoreResult (long-term only)
 *   /onboarding/connection     → ConnectionType
 *   /onboarding/match          → AutoMatch
 */

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useOnboarding } from '../shared/lib/onboarding';
import { ProfileSetup } from '../screens/ProfileSetup';
import { ProjectType } from '../screens/ProjectType';
import { InterestSelection } from '../screens/InterestSelection';
import { SeriousnessTest } from '../screens/SeriousnessTest';
import { ScoreResult } from '../screens/ScoreResult';
import { ConnectionType } from '../screens/ConnectionType';
import { AutoMatch } from '../screens/AutoMatch';

export function OnboardingRoutes() {
  const { data } = useOnboarding();
  const navigate = useNavigate();
  const hasLong = data.projectTypes.includes('long_term');

  return (
    <Routes>
      <Route path="profile" element={
        <ProfileSetup
          onBack={() => navigate(-1)}
          onNext={() => navigate('/onboarding/project-type')}
        />
      } />
      <Route path="project-type" element={
        <ProjectType
          onBack={() => navigate(-1)}
          onNext={() => navigate('/onboarding/interests')}
        />
      } />
      <Route path="interests" element={
        <InterestSelection
          onBack={() => navigate(-1)}
          onNext={() => navigate(hasLong ? '/onboarding/seriousness' : '/onboarding/connection')}
        />
      } />
      <Route path="seriousness" element={
        <SeriousnessTest
          onBack={() => navigate(-1)}
          onNext={() => navigate('/onboarding/score')}
        />
      } />
      <Route path="score" element={
        <ScoreResult
          onBack={() => navigate(-1)}
          onNext={() => navigate('/onboarding/connection')}
        />
      } />
      <Route path="connection" element={
        <ConnectionType
          onBack={() => navigate(-1)}
          onNext={() => navigate('/onboarding/match')}
        />
      } />
      <Route path="match" element={
        <AutoMatch
          onChat={(chatRoomId) => navigate(`/app/chat/${chatRoomId}`)}
          onHome={() => navigate('/app/home')}
          onBack={() => navigate('/app/home')}
        />
      } />
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/onboarding/profile" replace />} />
    </Routes>
  );
}
