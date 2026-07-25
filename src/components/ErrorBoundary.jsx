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
        <div className="min-h-screen bg-[#F3F1F7] text-slate-800 p-6 flex flex-col items-center justify-center font-sans">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-[10px] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-xl font-bold">Application Error Caught</h2>
            </div>
            <p className="text-sm text-slate-600">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            {this.state.error?.stack && (
              <pre className="p-4 rounded-[10px] bg-slate-50 border border-slate-200 text-red-600 text-xs font-mono overflow-x-auto max-h-48">
                {this.state.error.stack}
              </pre>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-[#6B4EFF] text-white font-medium rounded-lg text-sm hover:bg-[#573fd6] transition"
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
