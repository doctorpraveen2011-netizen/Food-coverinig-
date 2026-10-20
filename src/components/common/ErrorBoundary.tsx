import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FoodCovering caught an uncaught React runtime error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#/dashboard';
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] p-8 flex flex-col items-center justify-center text-center bg-slate-50 border border-slate-200 rounded-3xl m-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4 shadow-xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Something went wrong</h2>
          <p className="text-sm text-slate-600 mt-1 max-w-md">
            An unexpected error occurred while rendering this view. You can reload the page or return to the main dashboard.
          </p>
          {this.state.error && (
            <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl max-w-lg text-left text-xs font-mono text-rose-700 overflow-x-auto">
              {this.state.error.message || 'Unknown runtime error'}
            </div>
          )}
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" /> Go to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
