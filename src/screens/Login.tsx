/**
 * Login Screen
 * ------------
 * Email/password login. On success, the route guards automatically redirect
 * to either the onboarding flow or the main app based on profile state.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useAuth } from '../lib/auth';

export function Login({ onBack, onSuccess }: { onBack?: () => void; onSuccess?: () => void }) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    setLoading(false);
    // The route guards will redirect based on onboarding status
    if (onSuccess) onSuccess();
    else navigate('/app/home');
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="p-5">
        <button onClick={handleBack} className="flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-6 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold mb-2 text-ink-950">Welcome back</h1>
          <p className="text-ink-500 text-sm mb-8">Log in to continue to CollZap</p>

          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button fullWidth size="lg" onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
              ) : 'Login'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
