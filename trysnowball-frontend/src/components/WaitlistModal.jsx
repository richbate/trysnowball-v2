/**
 * Waitlist Modal Component
 * Triggered when unauthenticated users try to use gated features
 */

import React, { useState, useEffect } from 'react';
import { X, Mail, Sparkles } from 'lucide-react';
import { requestMagicLink } from '../utils/magicLinkAuth';
import { trackReferralSource } from '../utils/referralUtils';
import { analytics } from '../lib/posthog';

const WaitlistModal = ({ isOpen, onClose, triggerAction = null }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Referral tracking
  const [referralId, setReferralId] = useState(null);
  const [isReferred, setIsReferred] = useState(false);

  // Check for referral tracking when modal opens
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const refId = urlParams.get('ref');
      
      if (refId) {
        setReferralId(refId);
        setIsReferred(true);
        trackReferralSource(refId);
        
        // Track modal opened via referral
        analytics.track('waitlist_modal_opened_referral', {
          referral_id: refId,
          trigger_action: triggerAction,
          timestamp: new Date().toISOString()
        });
      } else {
        // Track normal modal open
        analytics.track('waitlist_modal_opened', {
          trigger_action: triggerAction,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [isOpen, triggerAction]);

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

      // Track successful waitlist signup from modal
      analytics.track('waitlist_joined_modal', {
        email: email,
        referral_id: referralId,
        is_referred: isReferred,
        trigger_action: triggerAction,
        timestamp: new Date().toISOString(),
        entry_point: 'action_gate_modal'
      });

      setSubmitted(true);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setError('');
      setSubmitted(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Join the TrySnowball Beta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            // Success State
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Check your email! 📬
              </h3>
              
              <p className="text-gray-600 mb-6">
                {isReferred 
                  ? "Thanks to your referral, you're near the front of the line. We've sent you a magic link to get started."
                  : "We've sent you a magic link to join the beta. Click it to get started with TrySnowball."
                }
              </p>
              
              <button
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          ) : (
            // Signup Form
            <>
              {/* Referral Badge */}
              {isReferred && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-purple-800 text-center">
                    🎉 You've been referred! You'll skip the line.
                  </p>
                </div>
              )}
              
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  You're trying to access a feature that's part of our beta program.
                </p>
                <p className="text-sm text-gray-500">
                  Sign up for early access and we'll send you a magic link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div className="text-red-600 text-sm">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Joining Beta...' : 'Join the Beta'}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 text-center mt-4">
                No password needed. Just click the magic link we'll send you.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <span>🛡️ Privacy-first</span>
            <span>•</span>
            <span>📊 Your data stays local</span>
            <span>•</span>
            <span>🚀 Early access benefits</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;