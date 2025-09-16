/**
 * Home Dashboard Page
 * Calm "Today" dashboard showing status + one next action
 * Read-only view with derived selectors - no heavy calculations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDebts } from '../hooks/useDebts';
import { useForecastSelectors } from '../hooks/selectors/useForecastSelectors';
import { useSnowflakeSelectors } from '../hooks/selectors/useSnowflakeSelectors';
import { useGoalSelectors } from '../hooks/selectors/useGoalSelectors';
import { useCtaSelectors, getCtaPath, getCtaAnalytics } from '../hooks/selectors/useCtaSelectors';

// Dashboard components
import HeroForecast from '../components/home/HeroForecast';
import PaymentStrip from '../components/home/PaymentStrip';
import BoostRow from '../components/home/BoostRow';
import FocusDebtCard from '../components/home/FocusDebtCard';
import TeaserSnowflakes from '../components/home/TeaserSnowflakes';
import TeaserGoals from '../components/home/TeaserGoals';
import ContextCTA from '../components/home/ContextCTA';

const Home = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { debts, totalDebt, totalMinPayments } = useDebts();
  const [extraPayment, setExtraPayment] = useState(0); // Local boost state
  
  // Derived selectors
  const forecastData = useForecastSelectors();
  const snowflakeData = useSnowflakeSelectors(); 
  const goalData = useGoalSelectors();
  const ctaData = useCtaSelectors();
  
  // Local boost state (persists on debounce)
  const [localBoost, setLocalBoost] = useState(extraPayment * 100); // Convert to pennies
  const [boostTimer, setBoostTimer] = useState(null);
  
  // CTA logic now handled by selector hook
  
  // Handle boost changes with debounce
  const handleBoostChange = (pennies) => {
    setLocalBoost(pennies);
    
    // Clear existing timer
    if (boostTimer) clearTimeout(boostTimer);
    
    // Set new timer to persist after 500ms
    const timer = setTimeout(() => {
      setExtraPayment(pennies / 100); // Convert back to pounds
      
      // Track analytics
      if (window.posthog) {
        window.posthog.capture('home_boost_change', {
          value_pennies: pennies,
          delta_months: forecastData.monthsSaved,
          delta_interest_saved: forecastData.interestSaved
        });
      }
    }, 500);
    
    setBoostTimer(timer);
  };
  
  // Handle CTA clicks with enhanced analytics
  const handleCtaClick = () => {
    const { kind } = ctaData;
    
    // Enhanced analytics tracking
    if (window.posthog) {
      const analyticsData = getCtaAnalytics(ctaData, {
        hasDebts: debts && debts.length > 0,
        hasBoost: extraPayment > 0,
        totalDebtPennies: Math.round((totalDebt || 0) * 100),
        currentBoostPennies: localBoost
      });
      
      window.posthog.capture('home_cta_click', analyticsData);
    }
    
    // Handle special cases
    if (kind === 'try-boost') {
      // For try-boost, actually set a boost instead of navigating
      handleBoostChange(2500); // Default £25
      return;
    }
    
    // Navigate using smart path logic
    const path = getCtaPath(kind, { 
      currentBoost: Math.round(localBoost / 100) 
    });
    
    navigate(path);
  };
  
  // Handle focus debt click
  const handleAttackClick = (debtId) => {
    navigate(`/plan/strategy?focus=${debtId}`);
  };
  
  // Handle teaser clicks
  const handleTeaserClick = (target) => {
    if (window.posthog) {
      window.posthog.capture('home_teaser_click', { target });
    }
    navigate(`/plan/${target}`);
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (boostTimer) clearTimeout(boostTimer);
    };
  }, [boostTimer]);
  
  // Calculate helper text for boost
  const getBoostHelperText = () => {
    if (localBoost === 0) return null;
    const monthsSaved = Math.round(forecastData.monthsSaved || 0);
    const interestSaved = Math.round(forecastData.interestSaved || 0);
    
    if (monthsSaved > 0 && interestSaved > 0) {
      return `+£${localBoost / 100} → save ≈ £${interestSaved} and ${monthsSaved} months`;
    } else if (interestSaved > 0) {
      return `+£${localBoost / 100} → save ≈ £${interestSaved}`;
    }
    return null;
  };
  
  // Empty state
  if (!debts || debts.length === 0) {
    return (
      <div className={`min-h-screen ${colors.background} px-4 py-8`}>
        <div className="max-w-4xl mx-auto">
          {/* Welcome message */}
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold mb-4">Welcome to TrySnowball</h1>
            <p className="text-lg text-gray-600 mb-8">
              Let's start by adding your debts to see your path to freedom
            </p>
            <ContextCTA kind="add-debts" onClick={handleCtaClick} />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen ${colors.background} px-4 py-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Forecast */}
        <HeroForecast
          debtFreeDateLabel={forecastData.debtFreeDate}
          monthsSooner={forecastData.monthsSaved}
          interestSavedApprox={forecastData.interestSaved * 100} // Convert to pennies
        />
        
        {/* Payment Strip */}
        <PaymentStrip
          total={(totalDebt || 0) * 100} // Convert to pennies
          minimums={(totalMinPayments || 0) * 100}
          boost={localBoost}
        />
        
        {/* Boost Row */}
        <BoostRow
          value={localBoost}
          presets={[2500, 5000, 10000, 25000]} // £25, £50, £100, £250
          onChange={handleBoostChange}
          helperText={getBoostHelperText()}
        />
        
        {/* Focus Debt Card */}
        {forecastData.focusDebt && (
          <FocusDebtCard
            debtId={forecastData.focusDebt.id}
            name={forecastData.focusDebt.name}
            payoffMonthLabel={forecastData.focusDebt.payoffMonth}
            onAttackClick={handleAttackClick}
          />
        )}
        
        {/* Teasers Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snowflakeData.hasSnowflakes && (
            <TeaserSnowflakes
              totalAmount={snowflakeData.totalAmount}
              monthsSooner={snowflakeData.monthsSaved}
              onManageClick={() => handleTeaserClick('snowflakes')}
            />
          )}
          
          {goalData.hasActiveGoals && goalData.nextMilestone && (
            <TeaserGoals
              progressPct={goalData.nextMilestone.progress || 0}
              targetPennies={(goalData.activeGoals[0]?.target || 0) * 100}
              onManageClick={() => handleTeaserClick('goals')}
            />
          )}
        </div>
        
        {/* Context CTA - sticky on mobile */}
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto p-4 md:p-0">
          <ContextCTA kind={ctaData.kind} onClick={handleCtaClick} />
        </div>
      </div>
    </div>
  );
};

export default Home;