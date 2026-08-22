/**
 * App Root Component
 * ------------------
 * Sets up all top-level providers (ErrorBoundary, AuthProvider, OnboardingProvider)
 * and the React Router configuration with all routes.
 *
 * Route structure:
 *   /                       → Splash (auto-redirects to /welcome)
 *   /welcome                → Welcome carousel (public)
 *   /login                  → Login (public-only)
 *   /signup                 → SignUp (public-only)
 *   /onboarding/*           → Onboarding flow (auth required, onboarding not complete)
 *   /app/*                  → Main app (auth required, onboarding complete)
 *   /app/add-peer/:type     → Add Peer flow (nested under app)
 *   /admin                  → Admin panel
 *   *                      → 404 → redirect to /
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/lib/auth';
import { OnboardingProvider } from './shared/lib/onboarding';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ProtectedRoute, OnboardingRoute, PublicRoute } from './routes/guards';
import { AppLayout } from './routes/AppLayout';

// Onboarding route wrappers (adapt callback-based screens to router navigation)
import { OnboardingRoutes } from './routes/OnboardingRoutes';
import { AddPeerFlowRoute } from './routes/AddPeerFlowRoute';

// Screens
import { Splash } from './screens/Splash';
import { Welcome } from './screens/Welcome';
import { SignUp } from './screens/SignUp';
import { Login } from './screens/Login';
import { HomeScreen } from './screens/HomeScreen';
import { CircleScreen } from './screens/CircleScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OnboardingProvider>
          <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<PublicRoute><Splash /></PublicRoute>} />
            <Route path="/welcome" element={<PublicRoute><Welcome /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

            {/* Onboarding flow */}
            <Route path="/onboarding/*" element={
              <OnboardingRoute>
                <OnboardingRoutes />
              </OnboardingRoute>
            } />

            {/* Main app */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/home" replace />} />
              <Route path="home" element={<HomeScreen />} />
              <Route path="circle" element={<CircleScreen />} />
              <Route path="chat" element={<ChatScreen />} />
              <Route path="chat/:roomId" element={<ChatScreen />} />
              <Route path="profile" element={<ProfileScreen />} />
              <Route path="add-peer/:type" element={<AddPeerFlowRoute />} />
            </Route>

            {/* Admin panel */}
            <Route path="/admin" element={<AdminScreen />} />

            {/* 404 → redirect to splash */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </BrowserRouter>
        </OnboardingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
