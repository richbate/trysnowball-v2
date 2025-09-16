/**
 * Debt Focus Selectors
 * Utilities for filtering timeline and matrix data to focus on specific debts
 */

/**
 * Extract focused debt ID from URL search params
 */
export function getFocusedDebtIdFromSearch(search) {
  const params = new URLSearchParams(search);
  const focus = params.get('focus');
  return focus || null;
}

/**
 * Apply focus filter to timeline data (for UI purposes only)
 */
export function withFocus(timeline, debtId) {
  if (!debtId || !timeline) return timeline;
  
  // This is primarily for matrix filtering - we don't recompute the timeline
  // The chart will use buildDebtBalanceSeries for focused debt visualization
  return timeline;
}

/**
 * Build a balance series for a specific debt from timeline data
 * Used for overlaying focused debt line on timeline chart
 */
export function buildDebtBalanceSeries(timeline, debtId) {
  if (!timeline || !debtId) return [];
  
  const series = [];
  let lastKnownRemaining = 0;
  
  timeline.forEach((month, monthIndex) => {
    if (!month?.items) {
      // If no items, use last known remaining
      series.push({ monthIndex, remaining: lastKnownRemaining });
      return;
    }
    
    // Find the item for this debt
    const debtItem = month.items.find((item) => 
      item.id === debtId || 
      item.debtId === debtId ||
      item.name === debtId // fallback for name-based matching
    );
    
    if (debtItem) {
      const remaining = debtItem.remaining || debtItem.balance || 0;
      lastKnownRemaining = remaining;
      series.push({ monthIndex, remaining });
    } else {
      // Use last known remaining if debt not found in this month
      series.push({ monthIndex, remaining: lastKnownRemaining });
    }
  });
  
  return series;
}

/**
 * Filter debts list to only include focused debt
 * Used for matrix column filtering
 */
export function filterDebtsForFocus(debts, focusedDebtId) {
  if (!focusedDebtId) return debts;
  
  return debts.filter(debt => 
    debt.id === focusedDebtId || 
    debt.name === focusedDebtId
  );
}

/**
 * Get debt label by ID from debts list
 */
export function getDebtLabelById(debts, debtId) {
  if (!debtId || !debts) return null;
  
  const debt = debts.find(d => d.id === debtId || d.name === debtId);
  return debt?.name || debt?.label || null;
}

/**
 * Build URL search string with focus parameter
 */
export function buildFocusSearchString(baseSearch, debtId) {
  const params = new URLSearchParams(baseSearch);
  
  if (debtId) {
    params.set('focus', debtId);
  } else {
    params.delete('focus');
  }
  
  return params.toString();
}

/**
 * Get payoff date for focused debt from timeline
 */
export function getFocusedDebtPayoffDate(timeline, debtId) {
  if (!timeline || !debtId) return null;
  
  // Find the month where this debt reaches 0
  for (let monthIndex = 0; monthIndex < timeline.length; monthIndex++) {
    const month = timeline[monthIndex];
    if (!month?.items) continue;
    
    const debtItem = month.items.find((item) => 
      item.id === debtId || 
      item.debtId === debtId ||
      item.name === debtId
    );
    
    if (debtItem && (debtItem.remaining === 0 || debtItem.balance === 0)) {
      // Calculate date from current date + monthIndex
      const payoffDate = new Date();
      payoffDate.setMonth(payoffDate.getMonth() + monthIndex);
      return payoffDate;
    }
  }
  
  return null;
}