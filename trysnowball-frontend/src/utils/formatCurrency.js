/**
 * Currency Formatting Utility - Routes through Settings Store
 * 
 * Provides consistent currency formatting across the application
 * using settings from IndexedDB instead of hardcoded values.
 */

const CURRENCY_CONFIG = {
  GBP: { locale: 'en-GB', currency: 'GBP' },
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'en-EU', currency: 'EUR' }
};

/**
 * Format currency amount using provided settings
 * 
 * @param {number} amount - The amount to format
 * @param {Object} settings - Settings object with currency preference
 * @param {Object} options - Additional Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, settings = { currency: 'GBP' }, options = {}) {
  const currency = settings?.currency || 'GBP';
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.GBP;
  
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(amount || 0);
  } catch (error) {
    // Fallback to GBP format if currency config fails
    console.warn(`[formatCurrency] Failed to format with ${currency}, using GBP fallback:`, error);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    }).format(amount || 0);
  }
}

/**
 * Format currency with compact notation (e.g., £1.2K, £5M)
 */
export function formatCurrencyCompact(amount, settings = { currency: 'GBP' }) {
  return formatCurrency(amount, settings, { notation: 'compact' });
}

/**
 * Format currency for input fields (no currency symbol, decimal precision)
 */
export function formatCurrencyInput(amount, settings = { currency: 'GBP' }) {
  const currency = settings?.currency || 'GBP';
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.GBP;
  
  try {
    return new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  } catch (error) {
    return new Intl.NumberFormat('en-GB', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  }
}

export default formatCurrency;