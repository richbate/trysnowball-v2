/**
 * Payment Success Page
 * Confirmation page after successful beta subscription
 */

import React, { useEffect } from 'react';

export default function Success() {
  useEffect(() => {
    // Clear any checkout session data from URL params
    const url = new URL(window.location.href);
    url.searchParams.delete('session_id');
    window.history.replaceState({}, document.title, url.pathname);
  }, []);

  return (
    <div className="min-h-screen purple-gradient-bg text-white">
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white">TrySnowball</h2>
        </div>
      </header>

      {/* Success Content */}
      <main className="max-w-2xl mx-auto px-6 pb-12 text-center">
        <div className="glass-card mt-12">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🎉</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            Welcome to TrySnowball Beta!
          </h1>

          <p className="text-xl text-white/80 mb-8">
            Your subscription is active and you're ready to start your debt-free journey.
          </p>

          <div className="space-y-4 text-left max-w-md mx-auto mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">What happens next?</h2>

            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg mt-1">✓</span>
              <div>
                <p className="text-white/90">Check your email for login details</p>
                <p className="text-white/70 text-sm">We've sent your account information to your email address</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg mt-1">✓</span>
              <div>
                <p className="text-white/90">Set up your first debts</p>
                <p className="text-white/70 text-sm">Add your credit cards, loans, and other debts to get started</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-green-400 text-lg mt-1">✓</span>
              <div>
                <p className="text-white/90">Watch your timeline</p>
                <p className="text-white/70 text-sm">See exactly when you'll be debt-free with our visual forecasts</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <a
              href="/app"
              className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Go to Dashboard
            </a>

            <p className="text-white/60 text-sm">
              Need help? Email us at support@trysnowball.com
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="glass-card mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Your Beta Benefits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">💰</span>
                <h4 className="font-semibold text-white">Locked-in Pricing</h4>
              </div>
              <p className="text-white/70 text-sm">
                Your £10/year rate is guaranteed for life as a beta member
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚀</span>
                <h4 className="font-semibold text-white">Early Access</h4>
              </div>
              <p className="text-white/70 text-sm">
                Get new features first and help shape the product
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📧</span>
                <h4 className="font-semibold text-white">Priority Support</h4>
              </div>
              <p className="text-white/70 text-sm">
                Direct access to our team for questions and feedback
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🔒</span>
                <h4 className="font-semibold text-white">Secure & Private</h4>
              </div>
              <p className="text-white/70 text-sm">
                Bank-grade encryption with no data selling
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/60 text-sm">
            © 2024 TrySnowball • Thank you for being a beta member!
          </p>
        </div>
      </footer>
    </div>
  );
}