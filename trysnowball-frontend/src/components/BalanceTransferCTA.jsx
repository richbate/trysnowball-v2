/**
 * BalanceTransferCTA - Call-to-action for balance transfer coaching
 * Shows when user has high-APR debts that might benefit from transfer analysis
 */

import React, { useState } from 'react';
import { Calculator, TrendingDown, X } from 'lucide-react';
import { useAnalytics } from '../hooks/useAnalytics';

const BalanceTransferCTA = ({ 
 debts = [], // Legacy prop for backward compatibility
 context = null, // New context-based prop
 onOpenCoach,
 className = '',
 onDismiss 
}) => {
 const [dismissed, setDismissed] = useState(false);
 const { trackEvent } = useAnalytics();

 // Use context if provided, otherwise fall back to debts filtering
 let highAPRDebts, totalHighAPRDebt, avgAPR;
 
 if (context) {
  // Use pre-calculated context from parent
  highAPRDebts = context.highAPRDebts || [];
  totalHighAPRDebt = context.totalDebt || 0;
  avgAPR = context.averageAPR || 0;
 } else {
  // Legacy path: filter debts directly
  highAPRDebts = debts.filter(debt => 
   debt.apr > 15 && debt.amount_pennies > 1000
  );
  totalHighAPRDebt = highAPRDebts.reduce((sum, debt) => sum + debt.amount_pennies, 0);
  avgAPR = totalHighAPRDebt > 0 ? highAPRDebts.reduce((sum, debt) => 
   sum + (debt.apr * debt.amount_pennies), 0
  ) / totalHighAPRDebt : 0;
 }

 // Generate unique key for this set of debts
 const debtKey = highAPRDebts
  .map(debt => `${debt.id || debt.name}:${debt.amount_pennies}`)
  .sort()
  .join('|');
 const storageKey = `bt_cta_dismissed:${debtKey}`;
 
 // Check if already dismissed for this specific debt combination
 const dismissedUntil = Number(localStorage.getItem(storageKey) || 0);
 const isCurrentlyDismissed = Date.now() < dismissedUntil;

 // Don't show if no qualifying debts, already dismissed, or insufficient debt
 if (highAPRDebts.length === 0 || dismissed || isCurrentlyDismissed || totalHighAPRDebt < 1000) {
  return null;
 }

 const handleOpenCoach = () => {
  trackEvent('balance_transfer_cta_clicked', {
   high_apr_debts_count: highAPRDebts.length,
   total_high_apr_debt: totalHighAPRDebt,
   average_apr: avgAPR.toFixed(1)
  });

  // Open AI Coach in balance transfer mode with context
  onOpenCoach && onOpenCoach({
   mode: 'balance_transfer',
   context: {
    highAPRDebts,
    totalDebt: totalHighAPRDebt,
    averageAPR: avgAPR
   }
  });
 };

 const handleDismiss = () => {
  trackEvent('balance_transfer_cta_dismissed', {
   high_apr_debts_count: highAPRDebts.length,
   total_high_apr_debt: totalHighAPRDebt,
   debt_key: debtKey
  });

  // Store dismissal with 7-day cooldown for this specific debt combination
  const dismissalTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
  localStorage.setItem(storageKey, String(dismissalTime));
  
  setDismissed(true);
  onDismiss && onDismiss();
 };

 return (
  <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4 relative ${className}`}>
   {/* Dismiss button */}
   <button
    onClick={handleDismiss}
    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
    aria-label="Dismiss"
   >
    <X className="w-4 h-4" />
   </button>

   <div className="flex items-start gap-3">
    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
     <Calculator className="w-5 h-5 text-blue-600" />
    </div>
    
    <div className="flex-1 min-w-0">
     <h3 className="text-lg font-semibold text-gray-900 mb-1">
      Thinking about a balance transfer?
     </h3>
     
     <p className="text-gray-600 text-sm mb-3">
      You have £{totalHighAPRDebt.toLocaleString()} in high-interest debt averaging {avgAPR.toFixed(1)}% APR. 
      Chat with Yuki to see if a balance transfer really saves you money.
     </p>

     <div className="flex items-center gap-4">
      <button
       onClick={handleOpenCoach}
       className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
       <TrendingDown className="w-4 h-4" />
       Analyze with Yuki
      </button>
      
      <div className="text-xs text-gray-500">
       Get personalized advice • Free analysis
      </div>
     </div>
    </div>
   </div>

   {/* Visual hint about what they'll get */}
   <div className="mt-3 pt-3 border-t border-blue-100">
    <div className="text-xs text-gray-500 space-y-1">
     <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
      Compare 0% offers vs. low APR options
     </div>
     <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
      See payoff timelines with real numbers
     </div>
     <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
      Understand the risks and rewards
     </div>
    </div>
   </div>
  </div>
 );
};

export default BalanceTransferCTA;