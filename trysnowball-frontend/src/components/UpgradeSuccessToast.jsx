/**
 * Post-Upgrade Success Toast
 * Shows celebration message after successful Pro subscription
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Crown, X, Sparkles } from 'lucide-react';
import { analytics } from '../lib/posthog';

const UpgradeSuccessToast = () => {
  const { colors } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  // Check for pro=true or pro=founder in URL params
  const proParam = searchParams.get('pro');
  const showSuccess = proParam === 'true' || proParam === 'founder';

  useEffect(() => {
    if (showSuccess) {
      setIsVisible(true);
      
      const plan = proParam === 'founder' ? 'founder' : 'pro';
      
      // Guard: only track if page loaded recently (prevents stale toasts)
      const pageLoadTime = performance.timeOrigin + performance.now();
      const currentTime = Date.now();
      const isRecentPageLoad = (currentTime - pageLoadTime) < 10000; // 10 seconds
      
      if (isRecentPageLoad) {
        // Track upgrade success (decorative, webhook is canonical)
        analytics.track('upgrade_success', {
          plan: plan,
          source: 'client_toast',
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('Skipping stale upgrade_success toast tracking');
      }

      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Clean up URL param after hiding
        setTimeout(() => {
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('pro');
          setSearchParams(newSearchParams, { replace: true });
        }, 500);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, searchParams, setSearchParams]);

  const handleClose = () => {
    setIsVisible(false);
    
    // Clean up URL param
    setTimeout(() => {
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('pro');
      setSearchParams(newSearchParams, { replace: true });
    }, 300);
  };

  if (!showSuccess || !isVisible) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-500">
      <div className={`${colors.surface} rounded-lg shadow-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 max-w-md mx-auto`}>
        <div className="flex items-start gap-3">
          {/* Success Icon */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">
                Welcome to Pro! 
              </h3>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-sm text-gray-700 mb-3">
              🎉 Your subscription is active! You now have unlimited AI coaching, pro charts, and priority support.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/ai/coach'}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded font-medium hover:bg-blue-700 transition-colors"
              >
                Try AI Coach →
              </button>
              <button
                onClick={() => window.location.href = '/billing'}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Manage Billing
              </button>
            </div>
          </div>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeSuccessToast;