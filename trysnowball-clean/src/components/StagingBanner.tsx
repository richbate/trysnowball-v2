/**
 * Staging Environment Banner
 * Visual indicator for staging environment
 */

import React from 'react';

export default function StagingBanner() {
  // Only show in staging environment
  if (process.env.REACT_APP_ENVIRONMENT !== 'staging') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🚧</span>
          <span className="font-semibold text-sm">STAGING ENVIRONMENT</span>
          <span className="text-xs opacity-90">
            staging.trysnowball.co.uk • Test Mode • No Real Payments
          </span>
        </div>
        
        <div className="flex items-center space-x-3 text-xs">
          <span>Version: {process.env.REACT_APP_VERSION}</span>
          {process.env.REACT_APP_COMMIT_HASH && (
            <span>Build: {process.env.REACT_APP_COMMIT_HASH?.substring(0, 7)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Staging Page Wrapper
 * Adds top padding to account for staging banner
 */
export function StagingWrapper({ children }: { children: React.ReactNode }) {
  const isStaging = process.env.REACT_APP_ENVIRONMENT === 'staging';
  
  return (
    <div className={isStaging ? 'pt-12' : ''}>
      <StagingBanner />
      {children}
    </div>
  );
}
