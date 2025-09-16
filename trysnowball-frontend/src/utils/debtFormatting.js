/**
 * Debt Formatting Utilities
 * Centralized formatting for currency, percentages, and other debt-related values
 */

/**
 * Format currency amount using UK locale
 */
export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '£0';
  return amount.toLocaleString('en-GB', { 
    style: 'currency', 
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Format percentage with 1 decimal place
 */
export const formatPercentage = (rate) => {
  if (rate == null || isNaN(rate)) return '0%';
  return `${rate.toFixed(1)}%`;
};

/**
 * Format large numbers with appropriate suffixes (K, M)
 */
export const formatCompactCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '£0';
  
  if (amount >= 1000000) {
    return `£${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `£${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
};

/**
 * Format months as years and months
 */
export const formatTimespan = (months) => {
  if (months == null || isNaN(months) || months <= 0) return '0 months';
  
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  }
  
  return `${years}y ${remainingMonths}m`;
};

/**
 * Format number without currency symbol (for inputs)
 */
export const formatNumber = (amount) => {
  if (amount == null || isNaN(amount)) return '0';
  return amount.toLocaleString('en-GB', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};