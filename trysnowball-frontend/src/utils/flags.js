// Feature flags and environment utilities
import { formatCurrency } from './formatCurrency';

export const isProd = process.env.NODE_ENV === 'production';
export const isDev = process.env.NODE_ENV === 'development';

// PII hiding for screenshots/marketing
export const HIDE_PII = process.env.REACT_APP_HIDE_PII === 'true';

// Feature flags - use REACT_APP_FLAG_* environment variables
export const flag = (name) => {
  return process.env[`REACT_APP_FLAG_${name.toUpperCase()}`] === 'true';
};

// Common feature flags
export const flags = {
  AI_COACH: flag('AI_COACH'),
  BETA_FEATURES: flag('BETA_FEATURES'),
  DEBUG_PANEL: flag('DEBUG_PANEL'),
  ANALYTICS: flag('ANALYTICS'),
  PAYMENTS: flag('PAYMENTS'),
  SHARING: flag('SHARING'),
  SCENARIOS: true, // set true for demo; can flip to false to hide
};

// PII-safe formatters for display
export const formatters = {
  currency: (value, showPII = !HIDE_PII) => {
    if (!showPII) return '£••••';
    return formatCurrency(value);
  },
  
  debtName: (name, showPII = !HIDE_PII) => {
    if (!showPII) return 'Debt ••••';
    return name;
  },
  
  percentage: (value, showPII = !HIDE_PII) => {
    if (!showPII) return '••%';
    return `${value.toFixed(1)}%`;
  },
  
  email: (email, showPII = !HIDE_PII) => {
    if (!showPII) return '••••@••••.com';
    return email;
  }
};

// Kill switch wrapper component
export const FeatureGate = ({ feature, fallback = null, children }) => {
  const isEnabled = flags[feature] !== false; // Default to enabled unless explicitly disabled
  return isEnabled ? children : fallback;
};