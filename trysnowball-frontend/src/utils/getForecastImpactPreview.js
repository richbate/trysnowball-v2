/**
 * getForecastImpactPreview
 * 
 * Utility function to calculate the impact of changing snowball amount
 * Returns preview data showing months saved and interest saved
 */

import { calculateSnowballTimeline } from '../selectors/amortization';

export const getForecastImpactPreview = (debts, currentAmount, newAmount) => {
  if (!debts || debts.length === 0) {
    return {
      monthsSaved: 0,
      newPayoffDate: null,
      interestSaved: 0,
      hasData: false
    };
  }

  try {
    // Calculate timeline with current amount
    const currentTimeline = calculateSnowballTimeline(debts, { extraPayment: currentAmount });
    // Calculate timeline with new amount
    const newTimeline = calculateSnowballTimeline(debts, { extraPayment: newAmount });
    
    const monthsSaved = Math.max(0, currentTimeline.months - newTimeline.months);
    const interestSaved = Math.max(0, currentTimeline.totalInterest - newTimeline.totalInterest);
    
    // Calculate payoff date
    const newPayoffDate = new Date();
    newPayoffDate.setMonth(newPayoffDate.getMonth() + newTimeline.months);
    
    return {
      monthsSaved,
      newPayoffDate: newPayoffDate.toLocaleDateString('en-GB', { 
        month: 'long', 
        year: 'numeric' 
      }),
      interestSaved: Math.round(interestSaved),
      hasData: true,
      currentMonths: currentTimeline.months,
      newMonths: newTimeline.months
    };
  } catch (error) {
    console.warn('[getForecastImpactPreview] Calculation error:', error);
    return {
      monthsSaved: 0,
      newPayoffDate: null,
      interestSaved: 0,
      hasData: false
    };
  }
};

export default getForecastImpactPreview;