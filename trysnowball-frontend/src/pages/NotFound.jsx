/**
 * 404 Not Found Page
 * Catches dead links and provides helpful navigation
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import DemoModeBanner from '../components/DemoModeBanner';

const NotFound = () => {
  const { colors } = useTheme();

  return (
    <div className={`min-h-screen ${colors.background}`}>
      <DemoModeBanner />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* 404 Hero */}
        <div className="mb-8">
          <h1 className={`text-6xl font-bold ${colors.text.primary} mb-4`}>
            404
          </h1>
          <h2 className={`text-2xl font-semibold ${colors.text.primary} mb-4`}>
            Page Not Found
          </h2>
          <p className={`text-lg ${colors.text.secondary} max-w-md mx-auto`}>
            This page doesn't exist. It might have been moved or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          
          <Link
            to="/my-plan"
            className={`inline-flex items-center px-6 py-3 ${colors.surface} ${colors.text.primary} rounded-lg font-semibold hover:${colors.surfaceSecondary} transition-colors border ${colors.border}`}
          >
            <Search className="w-5 h-5 mr-2" />
            Try Demo
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className={`inline-flex items-center px-6 py-3 ${colors.surface} ${colors.text.secondary} rounded-lg font-medium hover:${colors.surfaceSecondary} transition-colors border ${colors.border}`}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Popular Pages */}
        <div className={`${colors.surface} rounded-lg p-6 ${colors.border} border`}>
          <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>
            Popular Pages
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/my-plan"
              className={`p-4 rounded-lg ${colors.surfaceSecondary} hover:${colors.surface} transition-colors text-left`}
            >
              <div className={`font-medium ${colors.text.primary} mb-1`}>
                📊 My Plan
              </div>
              <div className={`text-sm ${colors.text.secondary}`}>
                See your payoff plan
              </div>
            </Link>
            
            <Link
              to="/debts"
              className={`p-4 rounded-lg ${colors.surfaceSecondary} hover:${colors.surface} transition-colors text-left`}
            >
              <div className={`font-medium ${colors.text.primary} mb-1`}>
                💳 Track Debts
              </div>
              <div className={`text-sm ${colors.text.secondary}`}>
                Add and update your debts
              </div>
            </Link>
            
            <Link
              to="/ai/coach"
              className={`p-4 rounded-lg ${colors.surfaceSecondary} hover:${colors.surface} transition-colors text-left`}
            >
              <div className={`font-medium ${colors.text.primary} mb-1`}>
                🤖 AI Coach
              </div>
              <div className={`text-sm ${colors.text.secondary}`}>
                Get personalized coaching
              </div>
            </Link>
            
            <Link
              to="/library"
              className={`p-4 rounded-lg ${colors.surfaceSecondary} hover:${colors.surface} transition-colors text-left`}
            >
              <div className={`font-medium ${colors.text.primary} mb-1`}>
                📚 Learn
              </div>
              <div className={`text-sm ${colors.text.secondary}`}>
                Guides and strategies
              </div>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8">
          <p className={`text-sm ${colors.text.muted}`}>
            Still can't find what you're looking for? Try our{' '}
            <Link to="/my-plan" className="text-blue-600 hover:text-blue-700 font-medium">
              Demo
            </Link>
            {' '}to explore TrySnowball.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;