/**
 * App Layout
 * ----------
 * Wraps all main app screens with the bottom navigation bar.
 * The <Outlet /> renders whichever route is active (home, circle, chat, profile).
 */

import { Outlet } from 'react-router-dom';
import { BottomNav } from '../shared/components/BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Outlet />
      <BottomNav />
    </div>
  );
}
