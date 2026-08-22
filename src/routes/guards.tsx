/**
 * Route Guards
 * ------------
 * Components that wrap protected routes and redirect users based on
 * their auth and onboarding status.
 *
 * - ProtectedRoute: Only allows authenticated users with completed onboarding.
 * - OnboardingRoute: Only allows authenticated users who haven't finished onboarding.
 * - PublicRoute: Only allows unauthenticated users (for login/signup screens).
 */

import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/** Full-screen loading spinner shown while auth state is being determined. */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-navy-700 border-t-electric-500 animate-spin" />
      <p className="text-sm text-ink-500 mt-4">Loading...</p>
    </div>
  );
}

/**
 * Wraps routes that require a signed-in user with completed onboarding.
 * Redirects to /login if not signed in, or to the onboarding flow if
 * onboarding is not yet complete.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If onboarding is not complete, redirect to the onboarding flow
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <>{children}</>;
}

/**
 * Wraps routes that are part of the onboarding flow.
 * Only accessible to authenticated users who haven't completed onboarding.
 * Redirects to the main app if onboarding is already done.
 */
export function OnboardingRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If onboarding is already complete, go to the app
  if (profile && profile.onboarding_completed) {
    return <Navigate to="/app/home" replace />;
  }

  return <>{children}</>;
}

/**
 * Wraps public-only routes (login, signup, welcome).
 * Redirects authenticated users with completed onboarding to the app.
 * Redirects authenticated users without completed onboarding to onboarding.
 */
export function PublicRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (user && profile) {
    if (profile.onboarding_completed) {
      return <Navigate to="/app/home" replace />;
    }
    return <Navigate to="/onboarding/profile" replace />;
  }

  return <>{children}</>;
}
