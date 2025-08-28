import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDemoMode } from '../providers/DemoModeProvider';
import { FEATURE } from '../utils/env';

const NoDebtsState = ({ 
  title = "Ready to Start?", 
  subtitle = "Add your debts and see your path to freedom",
  icon = "💳",
  buttonText = "Add Debts",
  buttonLink = "/debts",
  showSecondaryActions = false,
  showDemoAction = true,
  onAdd = null,
  onLoadDemo = null
}) => {
  const { colors } = useTheme();
  const { enterDemo } = useDemoMode();
  const navigate = useNavigate();

  const handleLoadDemo = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Enter demo mode
    enterDemo('home_button');
    
    // Navigate to home to see demo data
    navigate('/');
  };

  return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>{title}</h2>
      <p className={`${colors.text.secondary} mb-6 max-w-md mx-auto`}>
        {subtitle}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium inline-flex items-center justify-center space-x-2"
            data-test="add-debts-btn"
          >
            <span>{icon}</span>
            <span>{buttonText}</span>
          </button>
        ) : (
          <Link 
            to={buttonLink}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium inline-flex items-center justify-center space-x-2"
            data-test="add-debts-btn"
          >
            <span>{icon}</span>
            <span>{buttonText}</span>
          </Link>
        )}
        
        {showDemoAction && (
          <button
            type="button"
            onClick={onLoadDemo || handleLoadDemo}
            className={`px-6 py-3 border ${colors.border} rounded-lg hover:${colors.surfaceSecondary} transition-colors font-medium inline-flex items-center justify-center space-x-2`}
            data-test="load-demo-btn"
          >
            <span>🎮</span>
            <span>Try Live Demo</span>
          </button>
        )}
        
        {showSecondaryActions && (
          <>
            <Link 
              to="/profile"
              className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-flex items-center justify-center space-x-2`}
            >
              <span>📋</span>
              <span>Import Data</span>
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