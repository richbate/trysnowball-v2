/**
 * Referral System Utilities
 * Handles referral ID generation, tracking, and milestone sharing
 */

/**
 * Generate a unique referral ID from user data
 * @param {Object} user - User object
 * @returns {string} Short referral ID
 */
export const generateReferralId = (user) => {
  if (!user) return null;
  
  // Use user ID/email to create consistent referral ID
  const source = user.id || user.email || Date.now().toString();
  const hash = btoa(source).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return hash.toLowerCase();
};

/**
 * Create referral link
 * @param {string} referralId - User's referral ID
 * @returns {string} Full referral URL
 */
export const createReferralLink = (referralId) => {
  if (!referralId) return 'https://trysnowball.co.uk';
  return `https://trysnowball.co.uk/ref/${referralId}`;
};

/**
 * Track referral source in localStorage
 * @param {string} referralId - Referring user's ID
 */
export const trackReferralSource = (referralId) => {
  if (!referralId) return;
  
  try {
    localStorage.setItem('ref_from', referralId);
    localStorage.setItem('ref_timestamp', new Date().toISOString());
    console.log('[Referral] Tracked referral source:', referralId);
  } catch (error) {
    console.warn('[Referral] Failed to track referral source:', error);
  }
};

/**
 * Get stored referral source
 * @returns {Object|null} Referral data or null
 */
export const getReferralSource = () => {
  try {
    const refFrom = localStorage.getItem('ref_from');
    const refTimestamp = localStorage.getItem('ref_timestamp');
    
    if (!refFrom) return null;
    
    return {
      referralId: refFrom,
      timestamp: refTimestamp,
      isValid: true // Add expiry logic if needed
    };
  } catch (error) {
    console.warn('[Referral] Failed to get referral source:', error);
    return null;
  }
};

/**
 * Clear referral tracking (after successful signup)
 */
export const clearReferralTracking = () => {
  try {
    localStorage.removeItem('ref_from');
    localStorage.removeItem('ref_timestamp');
    console.log('[Referral] Cleared referral tracking');
  } catch (error) {
    console.warn('[Referral] Failed to clear referral tracking:', error);
  }
};

/**
 * Track analytics event for referrals
 * @param {string} event - Event name
 * @param {Object} payload - Event data
 */
export const trackReferralEvent = (event, payload = {}) => {
  try {
    // Log to console for now - extend with analytics service later
    console.log(`[Referral Analytics] ${event}:`, payload);
    
    // TODO: Send to analytics service
    // analytics.track(event, payload);
    
  } catch (error) {
    console.warn('[Referral] Failed to track event:', error);
  }
};

/**
 * Detect milestone achievements from debt data
 * @param {Array} debts - Current debts
 * @param {Array} previousDebts - Previous debt state
 * @returns {Object|null} Milestone data or null
 */
export const detectMilestone = (debts, previousDebts) => {
  if (!debts || !previousDebts || debts.length === 0) return null;
  
  // Check for debt cleared (balance went from > 0 to 0)
  const clearedDebts = debts.filter(debt => {
    const prevDebt = previousDebts.find(p => p.id === debt.id);
    return debt.balance === 0 && prevDebt && prevDebt.balance > 0;
  });
  
  if (clearedDebts.length > 0) {
    const clearedDebt = clearedDebts[0];
    return {
      type: 'debt_cleared',
      debtName: clearedDebt.name,
      amount: clearedDebt.previousBalance || 0,
      message: `🎉 I just cleared my ${clearedDebt.name}!`
    };
  }
  
  // Check for total debt milestones
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
  const prevTotalDebt = previousDebts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
  
  const milestones = [
    { threshold: 10000, message: "🎯 Just broke through the £10k barrier!" },
    { threshold: 5000, message: "🚀 Less than £5k to go!" },
    { threshold: 1000, message: "🏆 Under £1k left - almost there!" }
  ];
  
  for (const milestone of milestones) {
    if (prevTotalDebt > milestone.threshold && totalDebt <= milestone.threshold) {
      return {
        type: 'milestone_hit',
        threshold: milestone.threshold,
        currentDebt: totalDebt,
        message: milestone.message
      };
    }
  }
  
  // Check for first debt cleared
  const hasActiveDebts = debts.some(debt => debt.balance > 0);
  const hadActiveDebts = previousDebts.some(debt => debt.balance > 0);
  
  if (hadActiveDebts && !hasActiveDebts) {
    return {
      type: 'all_debts_cleared',
      message: "🎊 DEBT FREE! I just paid off my last debt!"
    };
  }
  
  return null;
};

/**
 * Generate share message for milestone
 * @param {Object} milestone - Milestone data
 * @param {string} referralLink - User's referral link
 * @returns {string} Formatted share message
 */
export const generateShareMessage = (milestone, referralLink) => {
  if (!milestone) return '';
  
  const baseMessage = milestone.message;
  const toolPromo = "If you're working on your debt, this tool is 🔥";
  const cta = `Try it here → ${referralLink}`;
  
  return `${baseMessage}\n${toolPromo}\n${cta}`;
};

/**
 * Generate Twitter share URL
 * @param {string} message - Tweet content
 * @returns {string} Twitter share URL
 */
export const generateTwitterShareUrl = (message) => {
  const encodedMessage = encodeURIComponent(message);
  return `https://twitter.com/intent/tweet?text=${encodedMessage}&via=trysnowballuk`;
};