/**
 * Signup Confirmation - Post-email submission screen
 * Shows while user waits for magic link, offers demo mode
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDemoMode } from '../providers/DemoModeProvider';
import { Mail, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';

const SignupConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enterDemo } = useDemoMode();
  const [resending, setResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  
  // Get email from location state
  const email = location.state?.email || 'your inbox';
  
  const handleTryDemo = async () => {
    // Set demo flag and navigate
    localStorage.setItem('SNOWBALL_DEMO_FLAG', 'true');
    await enterDemo('signup_wait', 'default');
    navigate('/demo');
  };
  
  const handleResend = async () => {
    if (resending || resendCount >= 3) return;
    
    setResending(true);
    
    try {
      const response = await fetch('/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: location.state?.email })
      });
      
      if (response.ok) {
        setResendCount(resendCount + 1);
      }
    } catch (error) {
      console.error('Failed to resend:', error);
    } finally {
      setResending(false);
    }
  };
  
  const handleBack = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          
          {/* Main message */}
          <h1 className="text-2xl font-bold text-center mb-2">
            📩 Check your inbox
          </h1>
          <p className="text-gray-600 text-center mb-6">
            We've sent you a magic link to sign in.
            <br />
            It usually arrives within a few seconds.
          </p>
          
          {/* Email display */}
          {location.state?.email && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-center">
              <p className="text-sm text-gray-500">Sent to:</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
          )}
          
          {/* Demo suggestion */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  While you wait, explore Demo Mode
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  See how TrySnowball works with example data.
                </p>
                <button
                  onClick={handleTryDemo}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Explore Demo Mode →
                </button>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleResend}
              disabled={resending || resendCount >= 3}
              className={`w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                resending || resendCount >= 3
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCount >= 3 ? (
                'Maximum resends reached'
              ) : resendCount > 0 ? (
                `Resend email (${3 - resendCount} left)`
              ) : (
                'Resend email'
              )}
            </button>
            
            <button
              onClick={handleBack}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
          
          {/* Help text */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Can't find the email? Check your spam folder or{' '}
            <a href="/help" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupConfirmation;