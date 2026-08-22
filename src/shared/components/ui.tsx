/**
 * Shared UI Components
 * --------------------
 * Reusable building blocks used across all features: Button, Screen wrapper,
 * ProgressBar, Card, Input, TextArea, ErrorBanner, SkeletonLoader.
 *
 * Any feature that needs a button or input should import from here so the
 * visual style stays consistent everywhere.
 */

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';

// ---------- Button ----------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed rounded-btn';
  const variants = {
    primary: 'bg-electric-500 text-white hover:bg-electric-600 shadow-lg shadow-electric-500/20',
    secondary: 'bg-surface text-ink-950 hover:bg-surface-100 border border-navy-700',
    ghost: 'text-electric-500 hover:bg-electric-50',
    outline: 'border border-electric-500 text-electric-500 hover:bg-electric-50',
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------- Screen wrapper ----------

export function Screen({
  children,
  className = '',
  showNav = false,
}: {
  children: ReactNode;
  className?: string;
  showNav?: boolean;
}) {
  return (
    <div
      className={`min-h-screen bg-surface text-ink-700 flex flex-col ${
        showNav ? 'pb-20' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ---------- ProgressBar ----------

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full h-1.5 bg-navy-700 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-electric-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ---------- Card ----------

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-card border border-navy-700 shadow-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ---------- Input ----------

export function Input({
  label,
  error,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>}
      <input
        className={`w-full bg-white border rounded-btn px-4 py-3 text-ink-950 placeholder-ink-300 outline-none transition-colors ${
          error ? 'border-red-500' : 'border-navy-700 focus:border-electric-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ---------- TextArea ----------

export function TextArea({
  label,
  error,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-700 mb-1.5">{label}</label>}
      <textarea
        className={`w-full bg-white border rounded-btn px-4 py-3 text-ink-950 placeholder-ink-300 outline-none transition-colors resize-none ${
          error ? 'border-red-500' : 'border-navy-700 focus:border-electric-500'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ---------- ErrorBanner ----------

export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-btn px-4 py-3 mb-4 flex items-start gap-2 animate-fade-in">
      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
      <p className="text-sm text-red-600 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ---------- SkeletonLoader ----------

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-navy-700/50 rounded-btn ${className}`} />
  );
}

// ---------- BackButton ----------

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-ink-500 hover:text-ink-950 transition-colors">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  );
}
