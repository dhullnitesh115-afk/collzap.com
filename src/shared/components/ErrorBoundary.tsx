/**
 * ErrorBoundary
 * -------------
 * A React error boundary that catches any unhandled JavaScript errors
 * in the component tree below it. Instead of showing a blank white page,
 * it renders a friendly "Something went wrong" screen with a retry button.
 *
 * Place this at the app root so it wraps all routes.
 */

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production this would send to an error tracking service
    console.error('Unhandled error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-card bg-white border border-navy-700 flex items-center justify-center mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-ink-950 mb-2">Something went wrong</h1>
          <p className="text-sm text-ink-500 mb-6 max-w-xs">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 bg-electric-500 text-white rounded-btn px-5 py-2.5 text-sm font-medium hover:bg-electric-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
