/**
 * SnowflakesTab Component
 * Manage one-time extra payments
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const SnowflakesTab = () => {
  const { colors } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className={`${colors.surface} rounded-lg p-6 border ${colors.border}`}>
        <h2 className="text-xl font-semibold mb-4">Snowflakes</h2>
        <p className="text-gray-600 mb-4">
          Log one-time extra payments to accelerate your debt freedom
        </p>
        
        {/* Coming soon state */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❄️</div>
          <h3 className="text-lg font-semibold mb-2">Snowflakes Coming Soon</h3>
          <p className="text-gray-600">
            Track windfalls, bonuses, and extra payments to see their impact
          </p>
        </div>
      </div>
    </div>
  );
};

export default SnowflakesTab;