/**
 * Waitlist Landing Page for TrySnowball
 * Conversion-optimized public page for unauthenticated users
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Target, TrendingUp, Clock, Users, CheckCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { requestMagicLink } from '../utils/magicLinkAuth';
import { trackReferralSource } from '../utils/referralUtils';
import { analytics } from '../lib/posthog';

const Waitlist = () => {
  const navigate = useNavigate();
  const { user, loading, isBeta } = useUser();
  
  // Form state
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Referral state
  const [referralId, setReferralId] = useState(null);
  const [isReferred, setIsReferred] = useState(false);

  // Check for referral tracking on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refId = urlParams.get('ref');
    
    if (refId) {
      setReferralId(refId);
      setIsReferred(true);
      trackReferralSource(refId);
      
      // Clean URL without page reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      // Track referral landing
      analytics.track('waitlist_referral_landing', {
        referral_id: refId,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  // Redirect authenticated users based on beta status
  useEffect(() => {
    if (!loading && user) {
      if (isBeta) {
        // Beta users go to main app
        navigate('/debts');
      } else {
        // Non-beta users see waitlist confirmation
        setSubmitted(true);
      }
    }
  }, [user, loading, isBeta, navigate]);

  // Handle waitlist signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Request magic link (this will create user account)
      const { data, error: authError } = await requestMagicLink(email);
      
      if (authError) {
        throw new Error(authError.message);
      }

      // Track successful waitlist signup
      analytics.track('waitlist_joined', {
        email: email,
        referral_id: referralId,
        is_referred: isReferred,
        timestamp: new Date().toISOString(),
        entry_point: 'waitlist_page'
      });

      setSubmitted(true);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return <WaitlistConfirmation isReferred={isReferred} isBeta={user?.isBeta} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">TrySnowball</div>
            </div>
            <div className="text-sm text-gray-600">
              Already invited?{' '}
              <button 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Referral Badge */}
          {isReferred && (
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-8">
              🎉 You've been invited by a TrySnowball user — you'll skip the line!
            </div>
          )}
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Debt freedom starts here.
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto">
            TrySnowball is a smarter way to get out of debt — built with privacy, planning, and personality.
          </p>

          {/* Signup Form */}
          <div className="max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  disabled={isSubmitting}
                />
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-left">
                  {error}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Joining Waitlist...' : 'Join the Waitlist'}
              </button>
            </form>
            
            <p className="text-sm text-gray-500 mt-4">
              We'll send you a magic link to get started. No password needed.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Add your debts</h3>
              <p className="text-gray-600">
                Securely input your debt information. Your data is private and protected with cloud sync.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Get a plan</h3>
              <p className="text-gray-600">
                Our AI coach Yuki creates a personalized snowball strategy to pay off your debts faster.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Celebrate every milestone</h3>
              <p className="text-gray-600">
                Track your progress, share victories, and stay motivated on your journey to debt freedom.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Badge */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-green-100 p-3 rounded-full">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
              🛡️ Privacy-First
            </h3>
            
            <p className="text-center text-gray-600 text-lg">
              Your financial data is private and secure. No credit checks, no ads, no data sharing.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Built for Real People
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            TrySnowball combines proven debt elimination strategies with modern technology.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">📊</div>
              <h4 className="font-semibold text-gray-900 mb-2">Debt Timeline</h4>
              <p className="text-sm text-gray-600">Visual progress tracking with payoff dates</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">💰</div>
              <h4 className="font-semibold text-gray-900 mb-2">Smart Planning</h4>
              <p className="text-sm text-gray-600">Optimized payment strategies that save money</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">🐈‍⬛</div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Coach Yuki</h4>
              <p className="text-sm text-gray-600">Personalized guidance and motivation</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-3xl mb-4">🎉</div>
              <h4 className="font-semibold text-gray-900 mb-2">Milestone Sharing</h4>
              <p className="text-sm text-gray-600">Celebrate wins with friends and family</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <div className="text-xl font-bold text-blue-600 mb-4">TrySnowball</div>
          <p className="text-sm">
            © {new Date().getFullYear()} TrySnowball. Making debt freedom accessible to everyone.
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * Waitlist Confirmation Component
 */
const WaitlistConfirmation = ({ isReferred, isBeta }) => {
  const navigate = useNavigate();

  if (isBeta) {
    // Beta users get immediate access
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🎉 Welcome to TrySnowball!
          </h1>
          
          <p className="text-gray-600 mb-8">
            You have beta access! Let's get started on your debt freedom journey.
          </p>
          
          <button
            onClick={() => navigate('/debts')}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Start Using TrySnowball
          </button>
        </div>
      </div>
    );
  }

  // Non-beta users see waitlist confirmation
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
          <Users className="w-12 h-12 text-blue-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're on the waitlist!
        </h1>
        
        <p className="text-gray-600 mb-4">
          {isReferred 
            ? "Thanks to your referral, you're near the front of the line. We'll notify you when it's your turn."
            : "We'll notify you when it's your turn to join TrySnowball."
          }
        </p>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">What happens next?</h3>
          <ul className="text-sm text-gray-600 text-left space-y-2">
            <li>✅ Check your email for a welcome message</li>
            <li>📬 We'll notify you when beta access is available</li>
            <li>🎯 Early access members get premium features free</li>
          </ul>
        </div>
        
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default Waitlist;