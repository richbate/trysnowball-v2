import { useState, useEffect, useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';
import { LocalDebtStore } from '../data/localDebtStore';
import { actionEvents, ACTION_EVENTS, trackActionEvent } from '../data/actionEventsMap';

/**
 * Maps PostHog events to action IDs for automatic completion tracking
 * Uses the unified actionEventsMap for consistency
 */
const EVENT_TO_ACTION_MAP = {
 // Get Started actions
 [ACTION_EVENTS.DEBT_ADDED]: ['first-snowflake'], 
 [ACTION_EVENTS.SNOWFLAKE_ADDED]: ['first-snowflake'],
 'credit_score_link_clicked': ['check-credit-file'],
 
 // Cut Spending actions
 'subscription_cancelled': ['cancel-one-subscription'],
 'budget_template_opened': ['build-budget-sheet'],
 'snoop_link_clicked': ['snoop-your-spending'],
 
 // Motivation actions
 'thermometer_downloaded': ['debt-thermometer'],
 [ACTION_EVENTS.MILESTONE_SHARED]: ['share-milestone'],
 [ACTION_EVENTS.DEBT_WHY_SAVED]: ['write-your-why'],
 
 // Habits actions
 'calendar_event_added': ['payday-calendar'],
 [ACTION_EVENTS.FORECAST_VIEWED]: ['monthly-forecast-review'],
 'no_spend_day_tracked': ['no-spend-challenge'],
 
 // Level Up actions
 [ACTION_EVENTS.STRATEGY_CHANGED_TO_AVALANCHE]: ['avalanche-method'],
 'rent_reporting_clicked': ['rent-credit-file'],
 [ACTION_EVENTS.SNAPSHOTS_IMPORTED]: ['import-history'],
 [ACTION_EVENTS.SIDE_HUSTLE_POT_CREATED]: ['side-hustle-pot']
};

/**
 * Tracks which library actions have been automatically completed
 * based on actual feature usage via PostHog events
 */
const useActionProgress = () => {
 const posthog = usePostHog();
 const [automaticCompleted, setAutomaticCompleted] = useState([]);
 const [manualCompleted, setManualCompleted] = useState([]);
 const [loading, setLoading] = useState(true);

 // Load manual completions from localStorage
 useEffect(() => {
  try {
   const stored = localStorage.getItem('libraryProgress');
   if (stored) {
    const parsed = JSON.parse(stored);
    setManualCompleted(parsed.done || []);
   }
  } catch (error) {
   console.error('Error loading manual progress:', error);
  }
 }, []);

 // Check for automatic completions based on app state
 const checkAutomaticCompletions = useCallback(async () => {
  const completed = new Set();
  
  try {
   // Check debt-related actions
   const store = LocalDebtStore.getInstance();
   const debts = await store.listDebts();
   
   if (debts.length > 0) {
    // User has added at least one debt
    completed.add('open-snowball-pot'); // They're using the app for debt tracking
   }
   
   // Check for snowflakes
   const snowflakesStr = localStorage.getItem('trysnowball_snowflakes');
   if (snowflakesStr) {
    try {
     const snowflakes = JSON.parse(snowflakesStr);
     if (Array.isArray(snowflakes) && snowflakes.length > 0) {
      completed.add('first-snowflake');
     }
    } catch (e) {
     console.error('Error parsing snowflakes:', e);
    }
   }
   
   // Check for imported history
   const hasSnapshots = await checkForSnapshots(store, debts);
   if (hasSnapshots) {
    completed.add('import-history');
   }
   
   // Check strategy preference
   const strategy = localStorage.getItem('trysnowball_strategy');
   if (strategy === 'avalanche') {
    completed.add('avalanche-method');
   }
   
   // Check if forecast has been viewed (based on navigation history)
   const hasViewedForecast = sessionStorage.getItem('viewed_forecast');
   if (hasViewedForecast) {
    completed.add('monthly-forecast-review');
   }
   
  } catch (error) {
   console.error('Error checking automatic completions:', error);
  }
  
  setAutomaticCompleted(Array.from(completed));
  setLoading(false);
 }, []);

 // Check for snapshots (imported history)
 const checkForSnapshots = async (store, debts) => {
  if (!debts || debts.length === 0) return false;
  
  for (const debt of debts) {
   const snapshots = await store.getSnapshots(debt.id, 1);
   if (snapshots && snapshots.length > 0) {
    return true; // Found at least one snapshot
   }
  }
  return false;
 };

 // Initial check on mount
 useEffect(() => {
  checkAutomaticCompletions();
 }, [checkAutomaticCompletions]);

 // Listen for PostHog events and update completions
 useEffect(() => {
  if (!posthog) return;

  const handleEvent = (eventName, properties) => {
   // Check if this event maps to any actions
   const mappedActions = EVENT_TO_ACTION_MAP[eventName];
   if (mappedActions && mappedActions.length > 0) {
    setAutomaticCompleted(prev => {
     const newCompleted = new Set(prev);
     mappedActions.forEach(actionId => newCompleted.add(actionId));
     return Array.from(newCompleted);
    });
   }
   
   // Special handling for specific events
   if (eventName === 'library_mark_done') {
    // This is a manual completion
    const actionId = properties?.article_id;
    if (actionId) {
     setManualCompleted(prev => {
      if (!prev.includes(actionId)) {
       const updated = [...prev, actionId];
       // Save to localStorage
       try {
        const stored = JSON.parse(localStorage.getItem('libraryProgress') || '{}');
        stored.done = updated;
        localStorage.setItem('libraryProgress', JSON.stringify(stored));
       } catch (e) {
        console.error('Error saving progress:', e);
       }
       return updated;
      }
      return prev;
     });
    }
   }
  };

  // PostHog doesn't have a direct event listener API, 
  // so we'll hook into the capture method
  const originalCapture = posthog.capture;
  if (originalCapture) {
   posthog.capture = function(eventName, properties) {
    handleEvent(eventName, properties);
    return originalCapture.apply(this, arguments);
   };
  }

  return () => {
   // Restore original capture method on cleanup
   if (originalCapture) {
    posthog.capture = originalCapture;
   }
  };
 }, [posthog]);

 // Track when features are opened/used
 const trackFeatureUse = useCallback((featureName) => {
  if (posthog) {
   posthog.capture('feature_opened', { feature: featureName });
  }
  
  // Also track in session for immediate updates
  if (featureName === 'forecast') {
   sessionStorage.setItem('viewed_forecast', 'true');
   checkAutomaticCompletions();
  }
 }, [posthog, checkAutomaticCompletions]);

 // Track action events (viewed, started, completed)
 const trackAction = useCallback((eventType, actionId, extraProps = {}) => {
  const eventName = `action_${eventType}`;
  trackActionEvent(eventName, actionId, {
   ...extraProps,
   timestamp: new Date().toISOString()
  });
 }, []);

 // Manual completion for actions that can't be auto-detected
 const completeAction = useCallback((actionId) => {
  setManualCompleted(prev => {
   if (!prev.includes(actionId)) {
    const updated = [...prev, actionId];
    
    // Save to localStorage
    try {
     const stored = JSON.parse(localStorage.getItem('libraryProgress') || '{}');
     stored.done = updated;
     localStorage.setItem('libraryProgress', JSON.stringify(stored));
    } catch (e) {
     console.error('Error saving progress:', e);
    }

    // Track completion event
    trackAction('completed', actionId, { 
     completion_type: 'manual',
     trigger_source: 'action_card'
    });

    return updated;
   }
   return prev;
  });
 }, [trackAction]);

 // Combined completed list (automatic + manual)
 const allCompleted = [...new Set([...automaticCompleted, ...manualCompleted])];

 return {
  completed: allCompleted,
  automaticCompleted,
  manualCompleted,
  loading,
  trackFeatureUse,
  trackAction,
  completeAction,
  refresh: checkAutomaticCompletions,
  isAutoCompleted: (actionId) => automaticCompleted.includes(actionId),
  isManualCompleted: (actionId) => manualCompleted.includes(actionId),
  isCompleted: (actionId) => allCompleted.includes(actionId),
  getActionConfig: (actionId) => actionEvents[actionId]
 };
};

export default useActionProgress;