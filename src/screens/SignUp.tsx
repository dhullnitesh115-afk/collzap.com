import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Upload, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui';
import { useOnboarding } from '../lib/onboarding';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { getCollegeFromEmail } from '../shared/lib/collegeDomains';

type Step = 'method' | 'email_otp' | 'fee_slip' | 'otp_verify' | 'college_info';
type OtpStage = 'idle' | 'sending' | 'sent' | 'verifying' | 'error';

export function SignUp({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  const navigate = useNavigate();
  const { update } = useOnboarding();
  const { signIn } = useAuth();
  const [step, setStep] = useState<Step>('method');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStage, setOtpStage] = useState<OtpStage>('idle');
  const [resendCountdown, setResendCountdown] = useState(0);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [error, setError] = useState('');

  const startResendTimer = () => {
    setResendCountdown(30);
    if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    resendTimerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(resendTimerRef.current!);
          resendTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setOtpStage('sending');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'send', email }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? 'Failed to send OTP. Please try again.');
        setOtpStage('error');
        return;
      }
      setOtpStage('sent');
      setStep('otp_verify');
      startResendTimer();
    } catch {
      setError('Network error. Please try again.');
      setOtpStage('error');
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setOtpStage('verifying');
    setError('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ action: 'verify', email, code: otp }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error ?? 'Incorrect OTP. Please try again.');
        setOtpStage('error');
        return;
      }
    } catch {
      setError('Network error. Please try again.');
      setOtpStage('error');
      return;
    }
    // Auto-derive college name from email domain
    const derivedCollege = getCollegeFromEmail(email);
    update({ email, password, verificationMethod: 'email_otp', collegeName: derivedCollege });
    setFullName('');
    setCollegeName(derivedCollege);
    setStep('college_info');
  };

  const submitCollegeInfo = async () => {
    if (creatingAccount) return;
    if (!fullName.trim() || !collegeName.trim()) {
      setError('Please enter your name and college name');
      return;
    }
    setError('');
    setCreatingAccount(true);
    update({ fullName: fullName.trim(), collegeName: collegeName.trim(), verificationMethod: 'email_otp' });
    // College name from email domain is not editable by user (per spec)
    // For email_otp, collegeName was auto-derived; for fee_slip, it's user-entered
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        // User may already exist — try signing in instead
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signUpError.message || signInError.message || 'Unable to create account. Please try again.');
          setCreatingAccount(false);
          return;
        }
      }
      // Wait for the auth state to settle before navigating
      await new Promise((r) => setTimeout(r, 300));
      if (onNext) onNext();
      else navigate('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setCreatingAccount(false);
    }
  };

  const uploadDoc = (file: File) => {
    setDocFile(file);
    setDocName(file.name);
    setError('');
  };

  const submitFeeSlip = async () => {
    if (uploading) return;
    if (!email || !password || !fullName || !collegeName) {
      setError('Please fill all fields and upload your document');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!docFile) {
      setError('Please upload your fee slip or ID card');
      return;
    }
    setError('');
    update({
      email,
      password,
      verificationMethod: 'fee_slip',
      collegeName,
      fullName,
    });
    setUploading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signUpError.message || signInError || 'Unable to create account. Please try again.');
          setUploading(false);
          return;
        }
      }

      // Upload verification doc now that user is signed in
      const { data: authData } = await supabase.auth.getUser();
      const uid = authData.user?.id;
      if (uid && docFile) {
        const ext = docFile.name.split('.').pop();
        const path = `${uid}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('verification-docs').upload(path, docFile);
        if (!upErr) {
          update({ verificationDocUrl: path });
        }
      }
      await new Promise((r) => setTimeout(r, 300));
      setUploading(false);
      if (onNext) onNext();
      else navigate('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <div className="p-5">
        <button onClick={() => onBack ? onBack() : navigate(-1)} className="flex items-center text-ink-500 hover:text-ink-950 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto no-scrollbar">
        {step === 'method' && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Create your account</h1>
            <p className="text-ink-500 text-sm mb-8">Choose how you'd like to verify your college identity</p>
            <div className="space-y-3">
              <button
                onClick={() => setStep('email_otp')}
                className="w-full bg-white border border-navy-700 rounded-card p-5 text-left hover:border-electric-500 transition-all active:scale-[0.98] shadow-card"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-btn bg-electric-50 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-electric-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-950">Email OTP</p>
                    <p className="text-sm text-ink-500">Verify with a 6-digit code sent to your email</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setStep('fee_slip')}
                className="w-full bg-white border border-navy-700 rounded-card p-5 text-left hover:border-electric-500 transition-all active:scale-[0.98] shadow-card"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-btn bg-electric-50 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-electric-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-950">Upload Fee Slip / ID Card</p>
                    <p className="text-sm text-ink-500">Manual verification with name & college</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {step === 'email_otp' && (
          <div className="animate-slide-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Verify Your Email</h1>
            <p className="text-ink-500 text-sm mb-6">We'll send a 6-digit OTP to your email address</p>
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
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button
                fullWidth
                size="lg"
                onClick={sendOtp}
                disabled={otpStage === 'sending'}
              >
                {otpStage === 'sending' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                ) : 'Send OTP'}
              </Button>
            </div>
          </div>
        )}

        {step === 'otp_verify' && (
          <div className="animate-slide-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Enter OTP</h1>
            <p className="text-ink-500 text-sm mb-6">
              We sent a 6-digit code to {email}
            </p>
            <input
              className="w-full bg-white border border-navy-700 rounded-card px-4 py-4 text-center text-2xl tracking-[0.5em] text-ink-950 outline-none focus:border-electric-500 transition-colors mb-4"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpStage('sent'); }}
              inputMode="numeric"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <Button fullWidth size="lg" onClick={verifyOtp} disabled={otpStage === 'verifying'}>
              {otpStage === 'verifying' ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
              ) : 'Verify & Continue'}
            </Button>
            <button
              onClick={sendOtp}
              disabled={resendCountdown > 0 || otpStage === 'sending'}
              className={`w-full text-center text-sm mt-4 transition-colors ${
                resendCountdown > 0 || otpStage === 'sending'
                  ? 'text-ink-300 cursor-not-allowed'
                  : 'text-electric-500 active:opacity-70'
              }`}
            >
              {otpStage === 'sending'
                ? 'Sending...'
                : resendCountdown > 0
                ? `Resend OTP in ${resendCountdown}s`
                : 'Resend OTP'}
            </button>
          </div>
        )}

        {step === 'fee_slip' && (
          <div className="animate-slide-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Upload Document</h1>
            <p className="text-ink-500 text-sm mb-6">Upload your fee slip or ID card for manual verification</p>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Input
                label="Full Name"
                placeholder="As per your ID card"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="College Name"
                placeholder="e.g. IIT Delhi"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Fee Slip / ID Card</label>
                <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-navy-600 rounded-card p-6 cursor-pointer hover:border-electric-500 transition-colors bg-white">
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-electric-500 animate-spin" />
                  ) : docName ? (
                    <div className="flex flex-col items-center">
                      <Check className="w-8 h-8 text-green-500 mb-1" />
                      <p className="text-sm text-ink-700">{docName}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-ink-300 mb-2" />
                      <p className="text-sm text-ink-500">Tap to upload</p>
                      <p className="text-xs text-ink-300">JPG, PNG, PDF up to 5MB</p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadDoc(f);
                    }}
                  />
                </label>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button fullWidth size="lg" onClick={submitFeeSlip} disabled={uploading}>
                {uploading ? 'Creating account...' : 'Create Account'}
              </Button>
            </div>
          </div>
        )}

        {step === 'college_info' && (
          <div className="animate-slide-in">
            <h1 className="text-2xl font-bold mb-2 text-ink-950">Tell us about you</h1>
            <p className="text-ink-500 text-sm mb-6">We need your name and college for matching you with peers</p>
            <div className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="College / Institute Name"
                placeholder="e.g. IIT Delhi, NIT Warangal"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                readOnly={getCollegeFromEmail(email) ? true : false}
              />
              {getCollegeFromEmail(email) && (
                <p className="text-xs text-ink-300 mt-1">College name is auto-detected from your email domain</p>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button fullWidth size="lg" onClick={submitCollegeInfo} disabled={creatingAccount}>
                {creatingAccount ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                ) : 'Create Account'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
