import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Global error handlers to capture client-side crashes and log to backend
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error("Window uncaught error:", event.error || event.message);
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'uncaught_window_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack || null
        })
      }).catch(() => {});
    } catch (e) {}
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'unhandled_promise_rejection',
          reason: String(event.reason),
          stack: event.reason?.stack || null
        })
      }).catch(() => {});
    } catch (e) {}
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'react_error_boundary',
          error: error?.toString(),
          stack: error?.stack,
          componentStack: errorInfo?.componentStack
        })
      }).catch(() => {});
    } catch (e) {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <span className="text-xl font-bold">!</span>
            </div>
            <h2 className="text-xl font-bold text-white">CMPDI Portal Recovered</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              A temporary interface issue occurred. The workspace state is preserved.
            </p>
            {this.state.error && (
              <pre className="text-left bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-red-400 overflow-x-auto max-h-48">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => {
                try {
                  const k = localStorage.getItem('groq_api_key');
                  localStorage.clear();
                  if (k) localStorage.setItem('groq_api_key', k);
                } catch (e) {}
                window.location.reload();
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)
