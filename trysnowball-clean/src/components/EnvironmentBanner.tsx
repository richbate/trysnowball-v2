/**
 * Environment Banner Component
 * Shows staging/development environment indicator
 */

import React from 'react';

export default function EnvironmentBanner() {
  const environment = process.env.REACT_APP_ENVIRONMENT;
  const showBanner = process.env.REACT_APP_SHOW_ENV_BANNER === 'true';
  const version = process.env.REACT_APP_VERSION || '2.0.0';

  // Only show banner in non-production environments
  if (environment === 'production' || !showBanner) {
    return null;
  }

  const getBannerConfig = () => {
    switch (environment) {
      case 'staging':
        return {
          bgColor: 'bg-orange-600',
          textColor: 'text-white',
          text: '🚧 STAGING ENVIRONMENT',
          description: 'This is a test environment - not live data'
        };
      case 'development':
        return {
          bgColor: 'bg-blue-600',
          textColor: 'text-white',
          text: '🔧 DEVELOPMENT MODE',
          description: 'Local development environment'
        };
      default:
        return {
          bgColor: 'bg-yellow-600',
          textColor: 'text-black',
          text: '⚠️ TEST ENVIRONMENT',
          description: 'Testing environment - not production'
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div className={`${config.bgColor} ${config.textColor} py-2 px-4 text-center text-sm font-medium relative z-50`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="font-bold">{config.text}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-xs opacity-90">{config.description}</span>
        </div>
        <div className="text-xs opacity-75">
          v{version} • {environment}
        </div>
      </div>
    </div>
  );
}