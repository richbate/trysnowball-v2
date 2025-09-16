// Initialize PostHog with lazy loading
export const initPostHog = async () => {
  // Lazy load PostHog to reduce initial bundle size
  const { default: posthog } = await import('posthog-js');
  const posthogKey = process.env.REACT_APP_POSTHOG_KEY || 
                     process.env.VITE_PUBLIC_POSTHOG_KEY || 
                     'phc_TiBCyhgzWEmeR7XdAFMpzAoqZXfeAvVDJwmqiP2Eo7X'; // Fallback for testing
  const posthogHost = process.env.REACT_APP_POSTHOG_HOST || 
                      process.env.VITE_PUBLIC_POSTHOG_HOST || 
                      'https://eu.i.posthog.com';

  if (!posthogKey) {
    console.warn('PostHog API key not found in environment variables');
    return;
  }
  // Check if we should exclude analytics before initializing
  const shouldExcludeAnalytics = () => {
    // Always exclude on localhost
    if (window.location.hostname === 'localhost') {
      console.log('🚫 PostHog excluded: localhost detected');
      return true;
    }
    
    // Always exclude in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚫 PostHog excluded: development environment');
      return true;
    }
    
    // Check for development user IDs in localStorage
    const storedUserId = localStorage.getItem('trysnowball-user-id');
    const devUserIds = [
      'dev-user-123',
      '01988524-b5a8-7492-aae0-60f028db3399',
      'user_10d2a63b03e0622b'
    ];
    
    if (devUserIds.includes(storedUserId)) {
      console.log('🚫 PostHog excluded: development user ID detected:', storedUserId);
      return true;
    }
    
    // Also check if any context or state has the dev user
    try {
      const contextUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (contextUser.id && devUserIds.includes(contextUser.id)) {
        console.log('🚫 PostHog excluded: development user in context:', contextUser.id);
        return true;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
    
    return false;
  };

  // If we should exclude, don't initialize PostHog at all
  if (shouldExcludeAnalytics()) {
    console.log('🚫 PostHog analytics excluded (dev environment)');
    return;
  }

  posthog.init(posthogKey, {
    api_host: posthogHost,
    person_profiles: 'identified_only', // Only create profiles for logged-in users
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ PostHog loaded successfully');
      }
    },
    // Additional exclusion in before_send as backup
    before_send: (event) => {
      const distinctId = posthog.get_distinct_id();
      
      // Exclude specific dev user IDs
      const excludedIds = [
        'dev-user-123',
        '01988524-b5a8-7492-aae0-60f028db3399',
        'user_10d2a63b03e0622b'
      ];
      
      if (excludedIds.includes(distinctId)) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 PostHog event blocked for dev user:', distinctId);
        }
        return null; // Don't send event
      }
      
      // Exclude localhost events as backup
      if (window.location.hostname === 'localhost') {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 PostHog event blocked for localhost');
        }
        return null;
      }
      
      return event;
    },
    // Session recording with privacy controls
    disable_session_recording: process.env.NODE_ENV === 'development',
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: {
        password: true,
        email: true,
        amount: true, // Mask financial data
      }
    },
    capture_pageview: true,
    capture_pageleave: true,
    // Exception capture
    capture_exceptions: true,
    capture_uncaught_exceptions: true,
    capture_promise_rejections: true,
    // Feature flags
    feature_flag_request_timeout: 3000,
    // Advanced tracking
    capture_performance: true,
  });

  // Track the environment and persistent properties
  posthog.register({
    app_version: process.env.REACT_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    user_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    user_agent: navigator.userAgent,
    platform: navigator.platform
  });

  // Make analytics available globally for convenience
  window.analytics = analytics;
  window._posthogInstance = posthog;
};

// Analytics helper functions
export const analytics = {
  // User identification (when they log in)
  identify: (userId, properties = {}) => {
    // Never identify dev users
    const devUserIds = ['dev-user-123', '01988524-b5a8-7492-aae0-60f028db3399', 'user_10d2a63b03e0622b'];
    if (devUserIds.includes(userId)) {
      console.log('🚫 Blocked identification for dev user:', userId);
      return;
    }
    if (window._posthogInstance) {
      window._posthogInstance.identify(userId, properties);
    }
  },

  // Track events
  track: async (eventName, properties = {}) => {
    // Additional safety check - never track dev users even if PostHog was initialized
    const devUserIds = ['dev-user-123', '01988524-b5a8-7492-aae0-60f028db3399', 'user_10d2a63b03e0622b'];
    
    // Lazy load PostHog if not already loaded
    if (!window._posthogInstance) {
      const { default: posthog } = await import('posthog-js');
      window._posthogInstance = posthog;
    }
    
    const posthog = window._posthogInstance;
    if (!posthog) return; // PostHog not loaded yet
    
    const currentUser = properties.user_id || posthog?.get_distinct_id?.();
    
    if (devUserIds.includes(currentUser)) {
      console.log('🚫 Blocked tracking event for dev user:', eventName, currentUser);
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [PostHog] Capturing event:', eventName, properties);
    }
    posthog.capture(eventName, properties);
  },

  // Track page views (automatic with capture_pageview: true)
  page: (pageName, properties = {}) => {
    if (window._posthogInstance) {
      window._posthogInstance.capture('$pageview', { 
        page_name: pageName,
        ...properties 
      });
    }
  },

  // Set user properties
  setUserProperties: (properties) => {
    if (window._posthogInstance) {
      window._posthogInstance.people.set(properties);
    }
  },

  // Enhanced user identification with debt context
  identifyWithDebtContext: (userId, debts = [], properties = {}) => {
    if (!window._posthogInstance) return;
    
    const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || debt.amount || 0), 0);
    const debtTypes = [...new Set(debts.map(debt => debt.type || 'unknown'))];
    
    window._posthogInstance.identify(userId, {
      ...properties,
      debt_count: debts.length,
      total_debt: totalDebt,
      debt_types: debtTypes,
      debt_level: totalDebt > 10000 ? 'high' : totalDebt > 5000 ? 'medium' : 'low',
      has_debt_data: debts.length > 0
    });

    // Set group for cohort analysis
    if (totalDebt > 0) {
      window._posthogInstance.group('debt_bracket', totalDebt > 10000 ? '10k+' : totalDebt > 5000 ? '5k-10k' : 'under-5k');
    }
  },

  // Feature flag helpers
  getFeatureFlag: (flagName) => {
    return window._posthogInstance?.getFeatureFlag(flagName);
  },

  isFeatureEnabled: (flagName) => {
    return window._posthogInstance?.isFeatureEnabled(flagName);
  },

  // Survey helpers
  getSurveys: () => {
    return window._posthogInstance?.getSurveys();
  },

  // Reset on logout
  reset: () => {
    if (window._posthogInstance) {
      window._posthogInstance.reset();
    }
  }
};

// Debt-specific tracking events
export const debtAnalytics = {
  // When user adds their first debt
  trackFirstDebt: (debtData) => {
    analytics.track('debt_added_first', {
      debt_type: debtData.debt_type || debtData.type || 'unknown',
      amount: debtData.amount || 0,
      interest_rate: debtData.interest_rate,
      min_payment: debtData.min_payment
    });
  },

  // When user adds any debt
  trackDebtAdded: (debtData) => {
    analytics.track('debt_added', {
      debt_type: debtData.debt_type || debtData.type || 'unknown',
      amount: debtData.amount || 0,
      interest_rate: debtData.interest_rate,
      total_debts: debtData.totalCount || 1
    });
  },

  // When user updates debt balance
  trackBalanceUpdate: (oldBalance, newBalance, debtId) => {
    const progressAmount = oldBalance - newBalance;
    analytics.track('debt_balance_updated', {
      debt_id: debtId,
      old_balance: oldBalance,
      new_balance: newBalance,
      progress_amount: progressAmount,
      is_progress: progressAmount > 0
    });
  },

  // When user hits a milestone
  trackMilestone: (milestoneType, debtData = {}) => {
    analytics.track('debt_milestone', {
      milestone_type: milestoneType,
      total_paid_off: debtData.total_paid_off || debtData.amount_paid_off,
      time_to_milestone: debtData.time_to_milestone,
      debt_name: debtData.debt_name,
      debt_type: debtData.debt_type,
      percent_complete: debtData.percent_complete,
      remaining_debt: debtData.remaining_debt,
      debts_remaining: debtData.debts_remaining,
      milestone_amount: debtData.milestone_amount
    });
  },

  // AI Coach usage
  trackAICoachMessage: (messageType, context = {}) => {
    analytics.track('ai_coach_message', {
      message_type: messageType,
      user_has_debts: context.hasDebts || false,
      total_debt_amount: context.totalDebt || 0
    });
  },

  // Feature usage
  trackFeatureUsage: (featureName, action = 'used') => {
    analytics.track('feature_usage', {
      feature: featureName,
      action: action
    });
  }
};

export default () => window._posthogInstance;