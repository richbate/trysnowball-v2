import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ArrowRight, Calculator } from 'lucide-react';
import { analytics } from '../../lib/posthog';

const StartHere = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const handleClick = () => {
    analytics.track('home_start_here_clicked', {
      timestamp: new Date().toISOString()
    });
    navigate('/my-plan');
  };

  return (
    <div className={`${colors.surface} rounded-2xl border ${colors.border} shadow-sm p-8 mb-8`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className={`text-2xl font-bold ${colors.text.primary} mb-3`}>
            Ready to Plan Your Escape?
          </h2>
          <p className={`${colors.text.secondary} mb-6`}>
            Add your debts and see your complete payoff timeline. Our smart planner shows you exactly when you'll be free — and how to get there faster.
          </p>
          <button
            onClick={handleClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Start Planning
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartHere;