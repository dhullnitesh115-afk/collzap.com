/**
 * Welcome Carousel
 * ----------------
 * 3-slide intro carousel shown to new users. After the last slide,
 * the user can sign up or log in. Uses React Router for navigation.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Target, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui';

const slides = [
  {
    icon: Users,
    title: 'Meet Your Kind of People',
    desc: 'Connect with college peers who share your drive, your interests, and your ambition. No random matches — only real connections.',
    accent: 'from-electric-500 to-electric-700',
  },
  {
    icon: Target,
    title: 'Match by Seriousness',
    desc: 'Our seriousness test pairs you with peers at your level. Whether you\'re a beginner or an expert, find someone who matches your energy.',
    accent: 'from-electric-400 to-electric-600',
  },
  {
    icon: MessageCircle,
    title: 'Start Building Together',
    desc: 'Long-term peers or short-term buddies. 1-on-1 or group. Chat in real-time and turn your college years into something extraordinary.',
    accent: 'from-electric-600 to-electric-800',
  },
];

export function Welcome({ onDone, onSkip, onLogin }: { onDone?: () => void; onSkip?: () => void; onLogin?: () => void }) {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];
  const Icon = slide.icon;

  const handleDone = () => {
    if (onDone) onDone();
    else navigate('/signup');
  };

  const handleLogin = () => {
    if (onLogin) onLogin();
    else navigate('/login');
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
    else navigate('/signup');
  };

  const next = () => {
    if (isLast) handleDone();
    else setIndex((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex justify-end p-5">
        <button
          onClick={handleSkip}
          className="text-sm text-ink-500 hover:text-ink-950 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div key={index} className="flex flex-col items-center text-center animate-slide-up">
          <div className={`w-28 h-28 rounded-card bg-gradient-to-br ${slide.accent} flex items-center justify-center shadow-2xl shadow-electric-500/20 mb-10`}>
            <Icon className="w-14 h-14 text-white" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold mb-4 leading-tight text-ink-950">{slide.title}</h2>
          <p className="text-ink-500 text-base leading-relaxed max-w-sm">{slide.desc}</p>
        </div>
      </div>

      <div className="px-8 pb-12">
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-8 bg-electric-500' : 'w-2 bg-navy-700'
              }`}
            />
          ))}
        </div>

        {isLast ? (
          <div className="space-y-3">
            <Button fullWidth size="lg" onClick={handleDone}>
              Sign Up
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button fullWidth size="lg" variant="outline" onClick={handleLogin}>
              Login
            </Button>
          </div>
        ) : (
          <Button fullWidth size="lg" onClick={next}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
