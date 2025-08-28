/**
 * Plan Workspace Page
 * Contains all heavy tools in tabs: Debts, Strategy, Forecast, Snowflakes, Goals
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import DemoWatermark from '../components/DemoWatermark';

// Tab components
import DebtsTab from '../components/plan/DebtsTab/DebtsTab';
import StrategyTab from '../components/plan/StrategyTab/StrategyTab';
import ForecastTab from '../components/plan/ForecastTab/ForecastTab';
import SnowflakesTab from '../components/plan/SnowflakesTab/SnowflakesTab';
import GoalsTab from '../components/plan/GoalsTab/GoalsTab';

const Plan = () => {
  const { colors: themeColors } = useTheme();
  const location = useLocation();
  const { debts } = useDebts();
  
  // Safe fallback for colors
  const colors = themeColors || {
    background: 'bg-gray-50',
    surface: 'bg-white',
    border: 'border-gray-200',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500'
    }
  };
  
  // Determine active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/debts')) return 'debts';
    if (path.includes('/strategy')) return 'strategy';
    if (path.includes('/forecast')) return 'forecast';
    if (path.includes('/snowflakes')) return 'snowflakes';
    if (path.includes('/goals')) return 'goals';
    
    // Default tab based on user state
    return debts && debts.length > 0 ? 'debts' : 'forecast';
  };
  
  const activeTab = getActiveTab();
  
  // Tab configuration
  const tabs = [
    { id: 'debts', label: 'Debts', path: '/plan/debts', icon: '💳' },
    { id: 'strategy', label: 'Strategy', path: '/plan/strategy', icon: '🎯' },
    { id: 'forecast', label: 'Forecast', path: '/plan/forecast', icon: '📊' },
    { id: 'snowflakes', label: 'Snowflakes', path: '/plan/snowflakes', icon: '❄️' },
    { id: 'goals', label: 'Goals', path: '/plan/goals', icon: '🎯' },
  ];
  
  return (
    <div className={`min-h-screen ${colors.background}`}>
      <DemoWatermark position="top-right" />
      
      {/* Header */}
      <div className={`${colors.surface} border-b ${colors.border}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="py-4">
            <h1 className="text-2xl font-bold">Your Debt Plan</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage debts, choose strategy, and track progress
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`
                    flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap
                    ${isActive 
                      ? 'border-primary text-primary font-medium' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="debts" element={<DebtsTab />} />
          <Route path="strategy" element={<StrategyTab colors={colors} timelineDebtsData={debts} hasNoDebtData={!debts || debts.length === 0} />} />
          <Route path="forecast" element={<ForecastTab colors={colors} timelineDebtsData={debts} hasNoDebtData={!debts || debts.length === 0} />} />
          <Route path="snowflakes" element={<SnowflakesTab />} />
          <Route path="goals" element={<GoalsTab />} />
          <Route 
            path="/" 
            element={
              <Navigate 
                to={debts && debts.length > 0 ? '/plan/debts' : '/plan/forecast'} 
                replace 
              />
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default Plan;