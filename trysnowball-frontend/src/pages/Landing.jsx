/**
 * Landing Page - Pre-auth entry point
 * Shows hero with primary signup CTA and secondary demo option
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useDemoMode } from '../providers/DemoModeProvider';
import { Sparkles, TrendingDown, Target, ChevronRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enterDemo } = useDemoMode();

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignup = () => {
    navigate('/auth/login');
  };

  const handleDemo = async () => {
    await enterDemo('landing', 'default');
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Build your debt payoff plan in 2 minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands using the debt snowball method to become debt-free faster. 
            UK-focused with real APR calculations.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleSignup}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
            >
              Sign up free with email
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleDemo}
              className="px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 border border-gray-300"
            >
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Just curious? Try Demo Mode
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingDown className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Debt Snowball Method</h3>
            <p className="text-gray-600">
              Pay off smallest debts first to build momentum and stay motivated.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Forecasting</h3>
            <p className="text-gray-600">
              See exactly when you'll be debt-free with our UK-accurate calculations.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Coach</h3>
            <p className="text-gray-600">
              Get personalized advice and strategies from our AI debt coach.
            </p>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-gray-600 mb-4">Trusted by UK families to manage</p>
          <p className="text-3xl font-bold text-gray-900">£2.3M+ in debt</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;