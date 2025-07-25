import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const NoDebtsState = ({ 
  title = "Add Your Debts Now", 
  subtitle = "Start your debt freedom journey by adding your debt information",
  icon = "💳",
  buttonText = "Add My Debts",
  buttonLink = "/debts",
  showSecondaryActions = false 
}) => {
  const { colors } = useTheme();

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>{title}</h2>
      <p className={`${colors.text.secondary} mb-6 max-w-md mx-auto`}>
        {subtitle}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          to={buttonLink}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium inline-flex items-center justify-center space-x-2"
        >
          <span>{icon}</span>
          <span>{buttonText}</span>
        </Link>
        
        {showSecondaryActions && (
          <>
            <Link 
              to="/profile"
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center space-x-2`}
            >
              <span>📋</span>
              <span>Bulk Import Debts</span>
            </Link>
            <Link 
              to="/baby-steps"
              className={`px-6 py-3 border ${colors.border} rounded-lg hover:${colors.surfaceSecondary} transition-colors font-medium inline-flex items-center justify-center space-x-2`}
            >
              <span>👶</span>
              <span>Start with Baby Steps</span>
            </Link>
            <Link 
              to="/money-makeover"
              className={`px-6 py-3 border ${colors.border} rounded-lg hover:${colors.surfaceSecondary} transition-colors font-medium inline-flex items-center justify-center space-x-2`}
            >
              <span>🚀</span>
              <span>Quick Win Plan</span>
            </Link>
          </>
        )}
      </div>
      
    </div>
  );
};

export default NoDebtsState;