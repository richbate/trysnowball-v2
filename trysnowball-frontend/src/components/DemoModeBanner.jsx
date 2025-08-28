/**
 * Demo Mode Banner Component
 * Shows dismissible banner for anonymous users in demo mode
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Target } from 'lucide-react';
import { useDebts } from '../hooks/useDebts';
import { analytics } from '../lib/posthog';

const DemoModeBanner = () => {
  const { debts } = useDebts();
  const navigate = useNavigate();
  const isDemoMode = debts.length > 0 && debts.some(debt => debt.isDemo);
  const [isDismissed, setIsDismissed] = useState(() => {
    // Check if user previously dismissed the banner
    return localStorage.getItem('demo_banner_dismissed') === 'true';
  });

  // Don't show banner if not in demo mode or if dismissed
  if (!isDemoMode || isDismissed) {
    return null;
  }

  const handleJoinNow = () => {
    // Track banner CTA click
    analytics.track('demo_banner_join_clicked', {
      timestamp: new Date().toISOString()
    });

    // Navigate to upgrade page
    navigate('/upgrade');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('demo_banner_dismissed', 'true');
    
    // Track banner dismissal
    analytics.track('demo_banner_dismissed', {
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                🎯 You're in Demo Mode. 
                <span className="hidden sm:inline ml-1">
                  Data stays on your device and doesn't sync.
                </span>
              </p>
              {/* Mobile subtitle */}
              <p className="text-xs text-blue-700 opacity-90 sm:hidden">
                Join to save and sync your progress
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleJoinNow}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Join Now
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-blue-600 hover:text-blue-700 transition-colors p-1"
              aria-label="Dismiss demo banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoModeBanner;