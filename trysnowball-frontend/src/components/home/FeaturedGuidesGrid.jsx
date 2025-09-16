import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { BookOpen, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { analytics } from '../../lib/posthog';

const FeaturedGuidesGrid = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  const guides = [
    {
      slug: 'money-makeover',
      title: 'Total Money Makeover',
      description: 'Learn the 7 Baby Steps method to financial freedom',
      icon: BookOpen,
      color: 'green'
    },
    {
      slug: 'debt-snowball-plan',
      title: 'Debt Snowball Method',
      description: 'Why paying smallest debts first works psychologically',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      slug: 'how-to-update-balances',
      title: 'Keep Your Plan Current',
      description: 'How to update balances and track your progress',
      icon: RefreshCw,
      color: 'purple'
    },
    {
      slug: 'priority-debts-uk',
      title: 'UK Priority Debts',
      description: 'Which debts to pay first for UK residents',
      icon: AlertCircle,
      color: 'red'
    }
  ];

  const handleGuideClick = (slug) => {
    analytics.track('home_featured_clicked', {
      guide_slug: slug,
      timestamp: new Date().toISOString()
    });
    navigate(`/library/${slug}`);
  };

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="mb-8">
      <h2 className={`text-xl font-bold ${colors.text.primary} mb-4`}>
        Featured Guides
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <button
              key={guide.slug}
              onClick={() => handleGuideClick(guide.slug)}
              className={`${colors.surface} rounded-2xl border ${colors.border} shadow-sm p-6 text-left hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColorClasses(guide.color)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${colors.text.primary} mb-1`}>
                    {guide.title}
                  </h3>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    {guide.description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeaturedGuidesGrid;