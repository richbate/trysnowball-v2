/**
 * Upgrade/Pricing Page - Purple Glassmorphism Design
 * Conversion-optimized pricing page for TrySnowball beta
 */

import React, { useEffect } from 'react';
import PaymentButton from '../components/PaymentButton';
import { analytics } from '../services/analytics';

export default function Upgrade() {
  useEffect(() => {
    // Track upgrade page view
    analytics.trackPageView('Upgrade', {
      referrer: document.referrer,
    });
  }, []);

  return (
    <div className="min-h-screen purple-gradient-bg text-white">
      {/* Header/Logo */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">TrySnowball</h2>
            <a
              href="/"
              className="text-white/80 hover:text-white transition-colors text-sm"
            >
              ← Back to home
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            Join the Beta
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Get early access to the UK's most effective debt payoff planner
          </p>
        </div>

        {/* Pricing Card */}
        <div className="glass-card text-center mb-12 relative overflow-hidden">
          {/* Beta Badge */}
          <div className="absolute -top-3 -right-3 bg-fuchsia-500 text-white px-6 py-2 rounded-full text-sm font-semibold transform rotate-12">
            Beta Access
          </div>

          <div className="pt-8 pb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              TrySnowball Beta
            </h2>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl md:text-5xl font-bold text-white">£10</span>
                <div className="text-left">
                  <div className="text-white/80 text-sm">per</div>
                  <div className="text-white/80 text-sm">year</div>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                Less than £1 per month • Cancel anytime
              </p>
            </div>

            <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">Unlimited debt tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">Snowball & avalanche strategies</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">Visual timeline forecasts</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">Milestone celebrations</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">UK-specific calculations</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-lg">✓</span>
                <span className="text-white/90">No ads, no data selling</span>
              </div>
            </div>

            <PaymentButton
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 w-full sm:w-auto mb-4"
              source="upgrade_page"
              ctaLocation="pricing_card"
            >
              Start Your Beta Access
            </PaymentButton>

            <div className="space-y-2 text-white/60 text-sm">
              <p>🔒 Secure payment with Stripe</p>
              <p>🇬🇧 UK households only</p>
              <p>💰 30-day money-back guarantee</p>
            </div>
          </div>
        </div>

        {/* Why Beta Section */}
        <div className="glass-card mb-12">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            Why Join the Beta?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Early Access</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Be among the first to use our advanced debt freedom tools,
                with exclusive features coming monthly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Shape the Future</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Your feedback directly influences new features. Help us build
                the perfect debt management tool for UK households.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">Locked-In Pricing</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Beta members keep their £10/year pricing forever.
                Standard pricing will increase after beta ends.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-3">UK-Focused</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Built specifically for British households, with UK interest
                calculations and consumer debt priorities.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="glass-card text-center mb-12">
          <h3 className="text-xl font-bold text-white mb-6">
            Join Other UK Households Already Planning Their Freedom
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-fuchsia-300 mb-2">150+</div>
              <div className="text-white/80 text-sm">Beta testers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-fuchsia-300 mb-2">£2.1M</div>
              <div className="text-white/80 text-sm">Debt being managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-fuchsia-300 mb-2">18 mo</div>
              <div className="text-white/80 text-sm">Average time saved</div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-card">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Frequently Asked Questions
          </h3>

          <div className="space-y-6 max-w-2xl mx-auto">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                How is this different from other debt calculators?
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                TrySnowball is built specifically for UK households with British interest
                calculations, consumer debt priorities, and motivational features to keep
                you on track. Most calculators just show numbers - we help you stay motivated.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Absolutely. Cancel your subscription anytime with one click.
                No questions asked, and you'll retain access until your current period ends.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Is my financial data secure?
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Your data is encrypted with bank-grade security and stored in the UK.
                We never sell your information or share it with third parties. GDPR compliant.
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-2">
                What happens after the beta ends?
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Beta members keep their £10/year pricing forever as a thank you for
                helping us improve the product. You'll automatically continue with full access.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center mt-12">
          <PaymentButton
            className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-xl px-10 py-5 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 mb-4"
            source="upgrade_page"
            ctaLocation="final_cta"
          >
            Join Beta - £10/year
          </PaymentButton>
          <div className="space-y-1 text-white/60 text-sm">
            <p>Start your debt-free journey today</p>
            <p>Cancel anytime • 30-day guarantee • Secure payment</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-white/60 text-sm mb-4">
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