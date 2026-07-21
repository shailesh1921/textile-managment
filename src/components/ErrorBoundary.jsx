import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#09060f] text-slate-100 p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-xl font-bold">Application Error Caught</h2>
            </div>
            <p className="text-sm text-slate-300">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            {this.state.error?.stack && (
              <pre className="p-4 rounded-lg bg-black/60 text-red-300 text-xs font-mono overflow-x-auto max-h-48">
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-[#ff5e36] text-white font-medium rounded-lg text-sm hover:bg-[#ff5e36]/90 transition"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
