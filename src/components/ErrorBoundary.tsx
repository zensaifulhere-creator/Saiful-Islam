import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(readable);
      if (parsed && typeof parsed.error === 'string') {
        readable = parsed.error;
      }
    } catch {
      // Keep raw error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7FBFD] text-[#2A3E4B] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-[#D6E6EF] rounded-2xl p-8 text-center shadow-sm space-y-4">
            <h1 className="serif-font text-2xl font-bold text-[#2A3E4B]">
              Unable to Load Workspace
            </h1>
            <p className="text-sm text-[#5A6F7D] leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#2A3E4B] hover:bg-[#7FA6B8] text-white text-sm font-semibold transition-colors"
            >
              Reload Portfolio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
