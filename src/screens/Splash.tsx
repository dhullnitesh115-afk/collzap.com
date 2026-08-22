/**
 * Splash Screen
 * -------------
 * Shows the CollZap logo with a pulsing animation, then the tagline,
 * then automatically navigates to the welcome carousel.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Splash({ onDone }: { onDone?: () => void }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'logo' | 'tagline'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 800);
    const t2 = setTimeout(() => {
      if (onDone) onDone();
      else navigate('/welcome');
    }, 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, navigate]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-40 h-40 rounded-full bg-electric-500/10 animate-pulse-ring" />
        <div className="absolute w-40 h-40 rounded-full bg-electric-500/5 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
        <img
          src="/collzap_color_v1.png"
          alt="CollZap"
          className="relative w-36 h-36 object-contain drop-shadow-xl animate-fade-in"
        />
      </div>
      {phase === 'tagline' && (
        <p className="mt-4 text-sm text-ink-500 animate-slide-up">Find your campus peers</p>
      )}
    </div>
  );
}
