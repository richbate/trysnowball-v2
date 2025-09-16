import { Component } from 'react';
import logger from '../utils/logger';

export class AppErrorBoundary extends Component {
  state = { err: undefined };

  static getDerivedStateFromError(err) {
    return { err };
  }

  componentDidCatch(err, info) {
    logger.error('AppErrorBoundary caught error:', err, info);
    
    // Track error in PostHog if available
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('app_error_boundary_triggered', {
        error_message: err.message,
        error_stack: err.stack,
        component_stack: info.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
  }

  render() {
    if (this.state.err) {
      return (
        <div 
          role="alert" 
          className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Oops! Something broke
            </h1>
            <p className="text-gray-600 mb-6">
              Unexpected error occurred. Your data is safe — try reloading.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Home
              </button>
              
              <button
                onClick={() => this.setState({ err: undefined })}
                className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (dev only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-32">
                  {this.state.err.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}