/**
 * Onboarding Context Provider
 * ----------------------------
 * Holds all data collected during the multi-step onboarding flow:
 * signup credentials, profile info, project types, interests, scores,
 * and connection type. This data persists across screen transitions
 * so the user doesn't lose progress if they navigate between steps.
 *
 * The provider stays mounted across the auth state change that happens
 * during signup, preventing data loss when Supabase creates the account.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ProjectType, ConnectionType, Level, ShortTermLevel } from '../types';

export interface OnboardingData {
  // Sign up
  email: string;
  password: string;
  verificationMethod: 'email_otp' | 'fee_slip';
  collegeName: string;
  verificationDocUrl: string | null;

  // Profile
  photoUrl: string | null;
  fullName: string;
  year: string;
  city: string;
  storyAchievement: string;
  storySerious: string;
  storyLookingFor: string;
  proofOfWorkLink: string;

  // Project types
  projectTypes: ProjectType[];

  // Interests
  longTermInterests: string[];
  longTermSubTag: string;
  shortTermActivity: string;
  shortTermLevel: ShortTermLevel;

  // Scores
  scores: { interest: string; score: number; level: Level }[];

  // Connection
  connectionType: ConnectionType | null;
}

const initialData: OnboardingData = {
  email: '',
  password: '',
  verificationMethod: 'email_otp',
  collegeName: '',
  verificationDocUrl: null,
  photoUrl: null,
  fullName: '',
  year: '',
  city: '',
  storyAchievement: '',
  storySerious: '',
  storyLookingFor: '',
  proofOfWorkLink: '',
  projectTypes: [],
  longTermInterests: [],
  longTermSubTag: '',
  shortTermActivity: '',
  shortTermLevel: 'Beginner',
  scores: [],
  connectionType: null,
};

interface OnboardingContextValue {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
  reset: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const update = (partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  const reset = () => setData(initialData);

  return (
    <OnboardingContext.Provider value={{ data, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
