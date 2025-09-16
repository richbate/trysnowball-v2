/**
 * GoalsTab Component
 * Set and track debt freedom goals
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

const GoalsTab = () => {
  const { colors } = useTheme();
  
  return (
    <div className="space-y-6">
      <div className={`${colors.surface} rounded-lg p-6 border ${colors.border}`}>
        <h2 className="text-xl font-semibold mb-4">Goals</h2>
        <p className="text-gray-600 mb-4">
          Set milestones and track your debt freedom progress
        </p>
        
        {/* Coming soon state */}
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold mb-2">Goals Coming Soon</h3>
          <p className="text-gray-600">
            Set monthly targets and celebrate milestones on your journey
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoalsTab;