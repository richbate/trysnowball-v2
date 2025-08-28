/**
 * Unified Upgrade Page
 * Shows both Pro and Founders Access tiers with dynamic checkout
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import DemoModeBanner from '../components/DemoModeBanner';
import Button from '../components/ui/Button';
import { Crown, Check, Zap, BarChart3, Brain, Shield } from 'lucide-react';
import { analytics } from '../lib/posthog';
import { getToken } from '../utils/tokenStorage';

const Upgrade = () => {
  const { colors } = useTheme();
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processingPlan, setProcessingPlan] = useState(null);

  // Track page view on load
  React.useEffect(() => {
    if (!loading) {
      analytics.track('upgrade_flow_viewed', {
        plan: 'both_tiers',
        is_authenticated: !!user,
        user_id: user?.id || null,
        referrer: document.referrer || null,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
      });
    }
  }, [user, loading]);

  // Handle upgrade for specific plan
  const handleUpgrade = async (planType) => {
    if (!user?.email) {
      console.error('No user email for checkout - redirecting to login');
      navigate('/auth/login?redirect=/upgrade');
      return;
    }

    setProcessingPlan(planType);
    
    try {
      const isFounder = planType === 'founder';
      const isAnnual = planType === 'pro-annual';
      const plan = isFounder ? 'founder' : (isAnnual ? 'pro-annual' : 'pro');
      const priceMinor = isFounder ? 7900 : (isAnnual ? 2000 : 499);
      const mode = isFounder ? 'payment' : 'subscription';
      const successParam = isFounder ? 'pro=founder' : 'pro=true';
      
      // Debug JWT token
      const jwtToken = getToken();
      console.log('JWT token present:', !!jwtToken);
      console.log('JWT token length:', jwtToken?.length || 0);
      console.log('User object:', user);
      
      if (!jwtToken) {
        console.error('No JWT token found - user may not be logged in');
        alert('Please log in to upgrade your account');
        return;
      }
      
      // Track checkout started
      const priceId = isFounder ? null : (isAnnual ? process.env.REACT_APP_STRIPE_ANNUAL_PRICE_ID : process.env.REACT_APP_STRIPE_PRICE_ID);
      analytics.track('checkout_started', {
        plan: plan,
        price_id: priceId,
        amount_minor: priceMinor,
        currency: 'gbp',
        mode: mode,
        user_id: user.id,
        is_authenticated: true
      });

      // Create checkout session
      const endpoint = isFounder ? '/api/create-founder-checkout' : '/api/create-checkout-session';
      const body = isFounder ? {
        customerEmail: user.email,
        successUrl: `${window.location.origin}/my-plan?${successParam}`,
        cancelUrl: `${window.location.origin}/upgrade`
      } : {
        priceId: priceId,
        customerEmail: user.email,
        successUrl: `${window.location.origin}/my-plan?${successParam}`,
        cancelUrl: `${window.location.origin}/upgrade`
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      analytics.track('payment_failed', {
        plan: planType,
        mode: planType === 'founder' ? 'payment' : 'subscription',
        amount_minor: planType === 'founder' ? 7900 : 499,
        currency: 'gbp',
        error_message: error.message,
        stage: 'checkout_session_creation',
        user_id: user.id,
        is_authenticated: true
      });
      
      alert('Something went wrong. Please try again or contact support.');
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center`}>
        <div>Loading...</div>
      </div>
    );
  }

  // Allow everyone to view pricing, but require login for checkout

  // Show different content if already Pro/Founder (only when authenticated)
  if (user && user.email && (user.isPro || user.isFounder)) {
    return (
      <div className={`min-h-screen ${colors.background}`}>
        <DemoModeBanner />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold ${colors.text.primary} mb-4`}>
            You're already {user.isFounder ? 'a Founder' : 'Pro'}! 👑
          </h1>
          <p className={`text-lg ${colors.text.secondary} mb-8`}>
            Thanks for being a TrySnowball {user.isFounder ? 'Founder' : 'Pro'} member. Enjoy all the premium features!
          </p>
          <Button
            onClick={() => navigate('/my-plan')}
            leftIcon={BarChart3}
          >
            Go to My Plan
          </Button>
        </div>
      </div>
    );
  }

  const tiers = [
    {
      name: "Pro Monthly",
      price: "£4.99",
      period: "/month",
      planType: "pro-monthly",
      description: "Perfect for ongoing debt management with full AI support",
      features: [
        "Full AI Coach (50 chats/day)",
        "AI-Generated Reports (5/day)",
        "Pro Charts & Analytics", 
        "Priority Features",
        "Enhanced Support"
      ],
      highlighted: false,
      cta: "Subscribe Monthly"
    },
    {
      name: "Pro Annual",
      price: "£20",
      period: "/year",
      planType: "pro-annual",
      description: "Save 67% — just £1.67/month!",
      badge: "67% OFF",
      features: [
        "Everything in Monthly Pro",
        "Full AI Coach (50 chats/day)",
        "AI-Generated Reports (5/day)",
        "Pro Charts & Analytics", 
        "Priority Features",
        "Enhanced Support"
      ],
      highlighted: true,
      cta: "Subscribe Annually"
    },
    {
      name: "Founders Access",
      price: "£79",
      period: " one-time",
      planType: "founder", 
      description: "Lifetime access with extended AI limits",
      features: [
        "Everything in Pro",
        "Extended AI access (100 chats/day)",
        "Deep multi-year projections", 
        "Founders Badge & Recognition",
        "Lifetime Access — no ongoing fees"
      ],
      highlighted: false,
      cta: "Get Founders Access"
    }
  ];

  return (
    <div className={`min-h-screen ${colors.background}`}>
      <DemoModeBanner />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-4`}>
            Go Pro
          </h1>
          <p className={`text-lg ${colors.text.secondary} max-w-2xl mx-auto`}>
            Unlock unlimited AI coaching, advanced analytics, and priority features. Choose monthly or get lifetime access.
          </p>
        </div>

        {/* Pricing Tiers */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.planType}
              className={`${colors.surface} rounded-lg shadow-lg border-2 ${
                tier.highlighted ? 'border-blue-500' : 'border-yellow-500'
              } p-8 text-center relative`}
            >
              {/* Badge */}
              {(tier.highlighted || tier.badge) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className={`${tier.badge ? 'bg-green-500' : 'bg-blue-500'} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                    {tier.badge || 'Most Popular'}
                  </span>
                </div>
              )}

              <h2 className={`text-2xl font-bold ${colors.text.primary} mb-2`}>
                {tier.name}
              </h2>
              <div className="mb-4">
                <span className={`text-4xl font-bold ${colors.text.primary}`}>
                  {tier.price}
                </span>
                <span className={`text-lg ${colors.text.secondary}`}>
                  {tier.period}
                </span>
              </div>
              <p className={`text-sm ${colors.text.secondary} mb-6`}>
                {tier.description}
              </p>
              
              {/* Features */}
              <ul className="space-y-3 mb-8 text-left">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className={`text-sm ${colors.text.secondary}`}>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                onClick={() => {
                  // Enhanced analytics tracking before handling upgrade
                  analytics.track('upgrade_button_clicked', {
                    plan_type: tier.planType,
                    plan_name: tier.name,
                    plan_price: tier.price,
                    cta_text: user ? tier.cta : "Sign up to continue",
                    is_highlighted: tier.highlighted,
                    user_id: user?.id,
                    is_authenticated: !!user,
                    timestamp: new Date().toISOString(),
                    location: 'upgrade_page'
                  });
                  
                  handleUpgrade(tier.planType);
                }}
                disabled={processingPlan === tier.planType}
                loading={processingPlan === tier.planType}
                variant={tier.highlighted ? "primary" : "secondary"}
                size="lg"
                className="w-full"
                leftIcon={tier.highlighted ? Zap : Crown}
              >
                {processingPlan === tier.planType ? "Processing..." : 
                 user ? tier.cta : "Sign up to continue"}
              </Button>
              
              <p className={`text-xs ${colors.text.muted} mt-4`}>
                {tier.planType === 'pro' ? 'Cancel anytime. No hidden fees.' : 'One-time payment. Own forever.'}
              </p>
            </div>
          ))}
        </div>

        {/* Pricing Comparison */}
        <div 
          className={`${colors.surface} rounded-lg border ${colors.border} p-8 mb-12`}
          onMouseEnter={() => analytics.track('pricing_comparison_viewed', {
            location: 'upgrade_page',
            timestamp: new Date().toISOString(),
            user_id: user?.id
          })}
        >
          <div className="text-center mb-6">
            <h3 className={`text-xl font-semibold ${colors.text.primary} mb-2`}>
              💰 Annual vs Monthly Savings
            </h3>
            <p className={`text-sm ${colors.text.secondary}`}>
              Compare the costs over time for different plans
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <span className="text-2xl font-bold text-green-600">Annual Plan</span>
                </div>
                <p className={`text-sm ${colors.text.secondary} mb-4`}>
                  Best value - save 67% vs monthly
                </p>
                
                <div className="space-y-2 text-sm">
                  <div>Year 1: <strong>£20</strong></div>
                  <div>Year 2: <strong>£40</strong></div>
                  <div>Year 3: <strong>£60</strong></div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <span className="text-2xl font-bold text-blue-600">Monthly Plan</span>
                </div>
                <p className={`text-sm ${colors.text.secondary} mb-4`}>
                  Maximum flexibility
                </p>
                
                <div className="space-y-2 text-sm">
                  <div>Year 1: <strong>£59.88</strong></div>
                  <div>Year 2: <strong>£119.76</strong></div>
                  <div>Year 3: <strong>£179.64</strong></div>
                </div>
              </div>
            </div>
            
            <div className={`mt-6 text-center text-sm ${colors.text.secondary}`}>
              <p><strong>Founders Access (£79 one-time)</strong> pays for itself after 4 years vs Annual, or 16 months vs Monthly</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className={`${colors.surface} rounded-lg border ${colors.border} p-8`}>
          <h3 className={`text-xl font-semibold ${colors.text.primary} mb-6 text-center`}>
            Frequently Asked Questions
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className={`font-semibold ${colors.text.primary} mb-2`}>
                What's the difference between Monthly, Annual, and Founders?
              </h4>
              <p className={`text-sm ${colors.text.secondary} mb-4`}>
                Monthly Pro (£4.99/month) and Annual Pro (£20/year) both include 50 AI chats/day and 5 reports/day. Annual saves 67%! Founders Access (£79 one-time) includes 100 AI chats/day, 10 reports/day, and lifetime access.
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold ${colors.text.primary} mb-2`}>
                Can I cancel anytime?
              </h4>
              <p className={`text-sm ${colors.text.secondary} mb-4`}>
                Yes! Both Monthly and Annual Pro subscriptions can be cancelled anytime. Founders Access is lifetime — no cancellation needed.
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold ${colors.text.primary} mb-2`}>
                Can I switch between Monthly and Annual?
              </h4>
              <p className={`text-sm ${colors.text.secondary} mb-4`}>
                Yes! You can upgrade from Monthly to Annual at any time. Contact support if you need help with plan changes.
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold ${colors.text.primary} mb-2`}>
                Is my financial data secure?
              </h4>
              <p className={`text-sm ${colors.text.secondary} mb-4`}>
                Yes. Your data is stored securely in the cloud and tied to your private account. We never sell or share your data.
              </p>
            </div>
            
            <div>
              <h4 className={`font-semibold ${colors.text.primary} mb-2`}>
                Why daily limits instead of unlimited?
              </h4>
              <p className={`text-sm ${colors.text.secondary} mb-4`}>
                Realistic limits ensure sustainable AI costs and prevent misuse. Most users find 50-100 daily AI interactions more than enough for effective debt coaching.
              </p>
            </div>
          </div>
        </div>

        {/* Support Contact */}
        <div className="text-center mt-12">
          <p className={`text-sm ${colors.text.secondary} mb-4`}>
            Have questions about pricing or features?
          </p>
          <a
            href="mailto:hello@trysnowball.co.uk"
            className={`text-sm text-blue-600 hover:text-blue-700 font-medium`}
          >
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;