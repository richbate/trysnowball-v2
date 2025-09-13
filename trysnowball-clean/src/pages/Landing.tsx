/**
 * Landing Page - Purple Glassmorphism Design
 * Marketing page to introduce TrySnowball and drive beta signups
 */

import React, { useEffect } from 'react';
import { analytics } from '../services/analytics';

export default function Landing() {
  useEffect(() => {
    // Track landing page view
    analytics.trackPageView('Landing', {
      referrer: document.referrer,
      utm_source: new URLSearchParams(window.location.search).get('utm_source'),
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
    });
  }, []);

  const handleCTAClick = (location: string) => {
    analytics.track('cta_clicked', {
      text: 'Get Started Free',
      location,
      page: 'Landing'
    });
  };

  return (
    <div className="min-h-screen purple-gradient-bg text-white">
      {/* Hero Section */}
      <main className="min-h-screen flex flex-col justify-center items-center text-center px-6 relative">
        {/* Header/Logo */}
        <header className="absolute top-0 left-0 right-0 p-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-white">TrySnowball</h2>
          </div>
        </header>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            Debt freedom, one snowball at a time
          </h1>

          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            A simple UK debt payoff planner that keeps you motivated.
          </p>

          {/* Primary CTA */}
          <div className="pt-4">
            <a
              href="/upgrade"
              onClick={() => handleCTAClick('hero')}
              className="inline-block glass-button bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Get Started Free
            </a>
          </div>

          {/* Trust Signal */}
          <p className="text-sm text-white/60 pt-4">
            🇬🇧 Built for UK households • No ads • Cancel anytime
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Get out of debt faster with the proven snowball method
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="glass-card text-center">
              <div className="w-16 h-16 bg-fuchsia-600/20 rounded-full flex items-center justify-center mx-auto mb-6 glass-subtle">
                <span className="text-2xl font-bold text-fuchsia-300">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Add Your Debts</h3>
              <p className="text-white/80 leading-relaxed">
                Input your credit cards, loans, and other debts with their balances and interest rates.
                We'll organize everything for you.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card text-center">
              <div className="w-16 h-16 bg-fuchsia-600/20 rounded-full flex items-center justify-center mx-auto mb-6 glass-subtle">
                <span className="text-2xl font-bold text-fuchsia-300">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">See Your Payoff Plan</h3>
              <p className="text-white/80 leading-relaxed">
                Watch as we calculate your debt-free date and show you exactly how much faster
                extra payments help you escape debt.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card text-center">
              <div className="w-16 h-16 bg-fuchsia-600/20 rounded-full flex items-center justify-center mx-auto mb-6 glass-subtle">
                <span className="text-2xl font-bold text-fuchsia-300">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Stay Motivated</h3>
              <p className="text-white/80 leading-relaxed">
                Track your progress with milestone celebrations and see the snowball effect
                accelerating your journey to freedom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              See Your Debt Disappear
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Visualize your progress with clear charts and timeline forecasts
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Placeholder for app screenshots */}
            <div className="glass-card aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Debt Timeline</h3>
                <p className="text-white/70 text-sm">See exactly when you'll be debt-free</p>
              </div>
            </div>

            <div className="glass-card aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Snowball Effect</h3>
                <p className="text-white/70 text-sm">Watch payments accelerate over time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust/Privacy Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">
              Secure. Private. UK-specific.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">🔒</span>
                </div>
                <h3 className="font-semibold mb-2">Bank-Grade Security</h3>
                <p className="text-white/70 text-sm">Your data is encrypted and protected</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">🇬🇧</span>
                </div>
                <h3 className="font-semibold mb-2">UK-Focused</h3>
                <p className="text-white/70 text-sm">Built for British households and rates</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">🚫</span>
                </div>
                <h3 className="font-semibold mb-2">No Ads</h3>
                <p className="text-white/70 text-sm">Clean interface, no distractions</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">👥</span>
                </div>
                <h3 className="font-semibold mb-2">Private</h3>
                <p className="text-white/70 text-sm">Your finances stay yours</p>
              </div>
            </div>

            <p className="text-white/60 text-sm">
              We never sell your data or share your information with third parties.
              GDPR compliant with full data control.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Start Your Debt-Free Journey Today
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Join the beta for just £10/year and take control of your financial future.
              Cancel anytime.
            </p>

            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <a
                href="/upgrade"
                className="inline-block bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto"
              >
                Join Beta - £10/year
              </a>

              <a
                href="/demo"
                className="inline-block glass-button border border-white/30 hover:bg-white/20 text-white text-lg px-8 py-4 rounded-xl font-semibold w-full sm:w-auto"
              >
                Try Demo First
              </a>
            </div>

            <p className="text-white/60 text-sm mt-6">
              No commitment • Cancel anytime • 30-day money back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/60 mb-4">
            © 2024 TrySnowball • Made in the UK for UK households
          </p>
          <div className="space-x-6 text-sm">
            <button className="text-white/60 hover:text-white transition-colors">Privacy</button>
            <button className="text-white/60 hover:text-white transition-colors">Terms</button>
            <button className="text-white/60 hover:text-white transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}