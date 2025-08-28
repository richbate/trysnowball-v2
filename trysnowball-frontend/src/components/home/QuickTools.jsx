import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Calculator, Bot, FileText, TrendingUp } from 'lucide-react';
import { analytics } from '../../lib/posthog';

const QuickTools = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const tools = [
    {
      id: 'calculator',
      label: 'Debt Calculator',
      icon: Calculator,
      path: '/my-plan',
      description: 'Calculate payoff dates'
    },
    {
      id: 'ai-coach',
      label: 'AI Coach',
      icon: Bot,
      path: '/ai/coach',
      description: 'Get personalized advice'
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: FileText,
      path: '/my-plan?export=true',
      description: 'Download your plan'
    },
    {
      id: 'progress',
      label: 'Track Progress',
      icon: TrendingUp,
      path: '/my-plan/progress',
      description: 'View your achievements'
    }
  ];

  const handleToolClick = (tool) => {
    analytics.track('home_quicktool_clicked', {
      tool: tool.id,
      timestamp: new Date().toISOString()
    });
    navigate(tool.path);
  };

  return (
    <div className={`${colors.surface} rounded-2xl border ${colors.border} shadow-sm p-6`}>
      <h2 className={`text-xl font-bold ${colors.text.primary} mb-4`}>
        Quick Tools
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool)}
              className={`p-4 rounded-lg border ${colors.border} hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-center group`}
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${colors.surface} border ${colors.border} flex items-center justify-center group-hover:border-blue-500 dark:group-hover:border-blue-400 transition-colors`}>
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className={`text-sm font-medium ${colors.text.primary} mb-1`}>
                {tool.label}
              </div>
              <div className={`text-xs ${colors.text.secondary}`}>
                {tool.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickTools;