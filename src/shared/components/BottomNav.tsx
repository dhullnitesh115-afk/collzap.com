/**
 * Bottom Navigation Bar
 * ---------------------
 * The 4-tab navigation shown on all main app screens: Home, Circle, Chat, Profile.
 * Uses React Router's useNavigate for navigation and useLocation for active state.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, MessageCircle, User } from 'lucide-react';

const TABS = [
  { key: 'home', label: 'Home', icon: Home, path: '/app/home' },
  { key: 'circle', label: 'Circle', icon: Users, path: '/app/circle' },
  { key: 'chat', label: 'Chat', icon: MessageCircle, path: '/app/chat' },
  { key: 'profile', label: 'Profile', icon: User, path: '/app/profile' },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-navy-700 z-40 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {TABS.map(({ key, label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-btn transition-colors ${
                active ? 'text-electric-500' : 'text-ink-300 hover:text-ink-500'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
