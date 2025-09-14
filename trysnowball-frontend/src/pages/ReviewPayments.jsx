/**
 * Review Payments Page
 * Monthly payment planning with strategy-based allocation
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, Calculator, Target, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { 
 computePaymentPlan, 
 getStrategyDisplayName, 
 getStrategyDescription,
 validatePaymentPlan
} from '../utils/paymentPlanner';
import { fromCents, toCents } from '../lib/money';
import { usePaymentPrefs } from '../hooks/usePaymentPrefs';
import { secureAnalytics } from '../utils/secureAnalytics';
import { monthlyInterestCents } from '../utils/debtMath';

export default function ReviewPayments({ debts = [], recordPayment }) {
 const navigate = useNavigate();
 const { prefs, updatePrefs } = usePaymentPrefs();
 
 // Debug logging
 console.log('[ReviewPayments] Debts from props:', {
  debts: debts,
  count: debts?.length,
  sampleDebt: debts?.[0],
  hasRecordPayment: !!recordPayment
 });
 
 const [isPosting, setIsPosting] = useState(false);
 const [posted, setPosted] = useState(false);
 const [toastMessage, setToastMessage] = useState('');
 const [showToast, setShowToast] = useState(false);

 // Use shared preferences
 const extraBudget = prefs.extraPounds.toString();
 const strategy = prefs.strategy;
 const customFocusDebtId = prefs.customFocusId || '';
 
 // Helpers to update shared preferences
 const setExtraBudget = (value) => {
  updatePrefs({ extraPounds: parseFloat(value) || 0 });
 };
 
 const setStrategy = (value) => {
  updatePrefs({ strategy: value });
 };
 
 const setCustomFocusDebtId = (value) => {
  updatePrefs({ customFocusId: value || null });
 };

 // Filter to only active debts (with balance > 0)
 const activeDebts = useMemo(() => {
  const filtered = (debts || []).filter(debt => (debt.amount_pennies || 0) > 0);
  console.log('[ReviewPayments] Active debts:', {
   original: debts?.length || 0,
   filtered: filtered.length,
   sampleActiveDebt: filtered[0]
  });
  return filtered;
 }, [debts]);

 // Compute payment plan
 const paymentPlan = useMemo(() => {
  // Ensure debts have the required fields for payment planner
  const plannerDebts = activeDebts.map(debt => ({
   id: debt.id,
   name: debt.name,
   amount_pennies: debt.amount_pennies || 0,
   min_payment_pennies: debt.min_payment_pennies || 0,
   apr: debt.apr || debt.interest || 0, // Handle both field names
   debt_type: debt.debt_type || debt.type || 'credit_card'
  }));
  
  console.log('[ReviewPayments] Planner debts:', {
   count: plannerDebts.length,
   sample: plannerDebts[0]
  });
  
  return computePaymentPlan(
   plannerDebts,
   prefs.extraPounds,
   strategy,
   strategy === 'custom' ? customFocusDebtId : undefined
  );
 }, [activeDebts, prefs.extraPounds, strategy, customFocusDebtId]);

 const planValidation = useMemo(() => validatePaymentPlan(paymentPlan), [paymentPlan]);

 // Build min-vs-interest diagnostics per line
 const diagnostics = useMemo(() => {
  return paymentPlan.lines.map(line => {
   const interest_cents = monthlyInterestCents(line.current_balance_cents, toCents(line.apr_percentage));
   const min_cents = line.min_payment_pennies;
   const isInsufficient = min_cents > 0 && interest_cents > min_cents;
   return {
    debt_id: line.debt_id,
    interest_cents,
    min_cents,
    isInsufficient
   };
  });
 }, [paymentPlan.lines]);

 // Count how many debts have insufficient minimum payments
 const underpayingCount = diagnostics.filter(d => d.isInsufficient).length;

 // Toast helper
 const showToastMessage = (message) => {
  setToastMessage(message);
  setShowToast(true);
  setTimeout(() => setShowToast(false), 3000);
 };

 // Track analytics on page load
 useEffect(() => {
  if (activeDebts.length > 0) {
   secureAnalytics.capturePaymentsPlanOpened({
    debtCount: activeDebts.length,
    totalMin_cents: paymentPlan.total_minimum_cents,
    extraBudget_cents: paymentPlan.extra_budget_cents
   });
  }
 }, [activeDebts.length, paymentPlan.total_minimum_cents, paymentPlan.extra_budget_cents]);

 // Track insufficient minimum payment warnings
 useEffect(() => {
  if (underpayingCount > 0) {
   secureAnalytics.trackEvent('min_payment_insufficient_shown', {
    count: underpayingCount,
    strategy: strategy
   });
  }
 }, [underpayingCount, strategy]);

 const handlePostPayments = async () => {
  if (!planValidation.isValid || !recordPayment) {
   return;
  }

  setIsPosting(true);
  
  try {
   const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
   let successCount = 0;
   
   for (const line of paymentPlan.lines) {
    // Record minimum payment if > 0
    if (line.min_payment_pennies > 0) {
     await recordPayment({
      debt_id: line.debt_id,
      amount_pennies: line.min_payment_pennies,
      payment_type: 'system_minimum',
      payment_date: now,
      notes: `Minimum payment (${getStrategyDisplayName(strategy)})`
     });
     successCount++;
    }
    
    // Record extra payment if > 0
    if (line.extra_payment_cents > 0) {
     const extraType = line.is_focus_debt 
      ? (strategy === 'snowball' ? 'snowball_extra' : strategy === 'avalanche' ? 'avalanche_extra' : 'extra')
      : 'extra';
      
     await recordPayment({
      debt_id: line.debt_id,
      amount_pennies: line.extra_payment_cents,
      payment_type: extraType,
      payment_date: now,
      notes: `Extra payment (${getStrategyDisplayName(strategy)})`
     });
     successCount++;
    }
   }
   
   // Track analytics
   secureAnalytics.capturePaymentsPlanPosted({
    lines: paymentPlan.lines.length,
    strategy: strategy,
    extraAllocated_cents: paymentPlan.extra_allocated_cents,
    paymentsCreated: successCount
   });
   
   setPosted(true);
   
   // Redirect to debts tab after success
   setTimeout(() => {
    navigate('/plan/debts');
   }, 2000);
   
  } catch (error) {
   console.error('Failed to post payments:', error);
   alert('Failed to post some payments. Please try again.');
  } finally {
   setIsPosting(false);
  }
 };

 // Check if no debts are available
 if (!debts || debts.length === 0) {
  return (
   <div className="max-w-3xl mx-auto px-4 py-8">
    <Card className="p-8 text-center">
     <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
     <h2 className="text-xl font-bold text-gray-900 mb-2">No Debts Found</h2>
     <p className="text-gray-600 mb-4">
      Add some debts in the Debts tab to start planning payments.
     </p>
     <Button onClick={() => navigate('/plan/debts')}>
      Add Debts
     </Button>
    </Card>
   </div>
  );
 }

 if (activeDebts.length === 0) {
  return (
   <div className="max-w-3xl mx-auto px-4 py-8">
    <Card className="p-8 text-center">
     <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
     <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Debts</h2>
     <p className="text-gray-600 mb-4">
      {debts && debts.length > 0 
       ? `You have ${debts.length} debts, but none have balances. All paid off!`
       : "You don't have any debts yet. Add some in the Debts tab to start planning payments."
      }
     </p>
     <Button onClick={() => navigate('/plan/debts')}>
      {debts && debts.length > 0 ? 'View All Debts' : 'Add Debts'}
     </Button>
    </Card>
   </div>
  );
 }

 if (posted) {
  return (
   <div className="max-w-3xl mx-auto px-4 py-8">
    <Card className="p-8 text-center">
     <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
     <h2 className="text-xl font-bold text-gray-900 mb-2">Payments Posted!</h2>
     <p className="text-gray-600 mb-4">
      Successfully recorded {paymentPlan.lines.length} payment entries. 
      Redirecting to your debts...
     </p>
    </Card>
   </div>
  );
 }

 return (
  <div className="max-w-5xl mx-auto px-4 py-6">
   {/* Header */}
   <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan Details</h1>
    <p className="text-gray-600">
     See exactly how your {getStrategyDisplayName(strategy).toLowerCase()} strategy allocates payments this month
    </p>
   </div>

   <div className="grid lg:grid-cols-3 gap-6">
    {/* Strategy & Budget Panel */}
    <div className="lg:col-span-1">
     <Card className="p-6 mb-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Strategy</h3>
      
      {/* Strategy Selector */}
      <div className="space-y-3 mb-6">
       {(['snowball', 'avalanche', 'custom']).map((strategyOption) => (
        <label key={strategyOption} className="flex items-start space-x-3 cursor-pointer">
         <input
          type="radio"
          name="strategy"
          value={strategyOption}
          checked={strategy === strategyOption}
          onChange={(e) => {
           setStrategy(e.target.value);
           if (e.target.value !== 'custom') {
            setCustomFocusDebtId('');
           }
          }}
          className="mt-1"
         />
         <div className="flex-1">
          <div className="flex items-center space-x-2">
           {strategyOption === 'snowball' && <Target className="h-4 w-4 text-blue-500" />}
           {strategyOption === 'avalanche' && <Zap className="h-4 w-4 text-orange-500" />}
           {strategyOption === 'custom' && <Calculator className="h-4 w-4 text-purple-500" />}
           <span className="font-medium text-sm text-gray-900">
            {getStrategyDisplayName(strategyOption).replace(/\s*\([^)]*\)/g, '')}
           </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
           {getStrategyDescription(strategyOption)}
          </p>
         </div>
        </label>
       ))}
      </div>

      {/* Custom Focus Debt Selector */}
      {strategy === 'custom' && (
       <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
         Focus Debt
        </label>
        <select
         value={customFocusDebtId}
         onChange={(e) => setCustomFocusDebtId(e.target.value)}
         className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
         <option value="">Select debt to focus on</option>
         {activeDebts.map(debt => (
          <option key={debt.id} value={debt.id}>
           {debt.name} (£{fromCents(debt.amount_pennies || 0).toLocaleString()})
          </option>
         ))}
        </select>
       </div>
      )}

      {/* Snowball Amount Input */}
      <div className="mb-6">
       <label className="block text-sm font-medium text-gray-700 mb-2">
        Snowball Amount (£)
       </label>
       <input
        type="number"
        step="0.01"
        min="0"
        value={extraBudget}
        onChange={(e) => setExtraBudget(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="0.00"
       />
       <p className="text-xs text-gray-500 mt-1">
        Extra payment to accelerate your debt payoff
       </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-600">Minimum Payments:</span>
         <span className="font-medium">£{paymentPlan.total_minimum_gbp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">Snowball Budget:</span>
         <span className="font-medium">£{paymentPlan.extra_budget_gbp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">Snowball Allocated:</span>
         <span className={`font-medium ${paymentPlan.extra_budget_cents - paymentPlan.extra_allocated_cents === 0 ? 'text-green-600' : 'text-amber-600'}`}>
          £{paymentPlan.extra_allocated_gbp.toLocaleString()}
         </span>
        </div>
        {paymentPlan.extra_budget_cents > paymentPlan.extra_allocated_cents && (
         <>
          <div className="flex justify-between">
           <span className="text-gray-600">Unallocated:</span>
           <span className="font-medium text-amber-600">
            £{fromCents(paymentPlan.extra_budget_cents - paymentPlan.extra_allocated_cents).toLocaleString()}
           </span>
          </div>
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
           <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
             Only £{paymentPlan.extra_allocated_gbp.toLocaleString()} could be applied this month. 
             The remaining £{fromCents(paymentPlan.extra_budget_cents - paymentPlan.extra_allocated_cents).toLocaleString()} will 
             roll to your next snowball target once current debts are cleared.
            </p>
           </div>
          </div>
         </>
        )}
        <hr className="my-2" />
        <div className="flex justify-between">
         <span className="font-semibold text-gray-900">Total Planned:</span>
         <span className="font-bold text-gray-900">£{paymentPlan.total_planned_gbp.toLocaleString()}</span>
        </div>
       </div>
      </div>
     </Card>
    </div>

    {/* Payment Plan Table */}
    <div className="lg:col-span-2">
     <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
       <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Payment Plan</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
         strategy === 'snowball' ? 'bg-blue-100 text-blue-700' :
         strategy === 'avalanche' ? 'bg-orange-100 text-orange-700' :
         'bg-purple-100 text-purple-700'
        }`}>
         {strategy === 'snowball' ? '❄️ Snowball' :
          strategy === 'avalanche' ? '🏔️ Avalanche' :
          '🎯 Custom'}
        </span>
       </div>
       <Button
        onClick={handlePostPayments}
        disabled={!planValidation.isValid || isPosting || paymentPlan.lines.length === 0 || paymentPlan.total_planned_cents === 0}
        loading={isPosting}
        className="bg-green-600 hover:bg-green-700"
       >
        {isPosting ? 'Processing...' : 'Make These Payments'}
        <ArrowRight className="ml-2 h-4 w-4" />
       </Button>
      </div>

      {!planValidation.isValid && (
       <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex">
         <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
         <div className="ml-3">
          <h4 className="text-sm font-medium text-red-800">Plan Issues</h4>
          <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
           {planValidation.errors.map((error, index) => (
            <li key={index}>{error}</li>
           ))}
          </ul>
         </div>
        </div>
       </div>
      )}

      {/* Minimum Payment Warning Banner */}
      {underpayingCount > 0 && (
       <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex">
         <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
         <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium text-amber-800">
           Some minimums look too low
          </h4>
          <p className="mt-1 text-sm text-amber-700">
           {underpayingCount === 1 ? '1 debt has' : `${underpayingCount} debts have`} minimum payments below monthly interest. 
           This means {underpayingCount === 1 ? 'that balance' : 'those balances'} will grow each month.
           {' '}
           <a 
            href="/library/minimum-payments-explained" 
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-amber-800 font-medium"
           >
            Learn why minimums matter →
           </a>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
           <button
            onClick={() => {
             setStrategy('snowball');
             showToastMessage('Strategy updated to Snowball');
            }}
            className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
           >
            Switch to Snowball
           </button>
           <button
            onClick={() => {
             const newAmount = (parseFloat(extraBudget) + 25).toString();
             setExtraBudget(newAmount);
             showToastMessage('Added £25 to snowball budget');
            }}
            className="inline-flex items-center px-3 py-1.5 border border-amber-300 text-xs font-medium rounded-md text-amber-700 bg-amber-100 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
           >
            Add £25 extra
           </button>
          </div>
         </div>
        </div>
       </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
       <table className="w-full">
        <thead>
         <tr className="border-b border-gray-200">
          <th className="text-left py-3 px-2 font-medium text-gray-900">Debt</th>
          <th className="text-right py-3 px-2 font-medium text-gray-900">Balance</th>
          <th className="text-right py-3 px-2 font-medium text-gray-900">Min</th>
          <th className="text-right py-3 px-2 font-medium text-gray-900">Extra</th>
          <th className="text-right py-3 px-2 font-medium text-gray-900">Total</th>
          <th className="text-right py-3 px-2 font-medium text-gray-900">Remaining</th>
         </tr>
        </thead>
        <tbody>
         {paymentPlan.lines.map((line) => {
          const diagnostic = diagnostics.find(d => d.debt_id === line.debt_id);
          const isInsufficient = diagnostic?.isInsufficient || false;
          const interestGbp = diagnostic ? fromCents(diagnostic.interest_cents) : 0;

          return (
           <tr key={line.debt_id} className={`border-b border-gray-100 ${line.is_focus_debt ? 'bg-blue-50' : ''}`}>
            <td className="py-3 px-2">
             <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{line.debt_name}</span>
              {line.is_focus_debt && (
               <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Focus
               </span>
              )}
              {isInsufficient && (
               <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                Min below interest
               </span>
              )}
             </div>
             <div className="text-sm text-gray-500">{line.apr_percentage}% APR</div>
            </td>
            <td className="text-right py-3 px-2 text-gray-900">
             £{line.current_balance_gbp.toLocaleString()}
            </td>
            <td className="text-right py-3 px-2 text-gray-900">
             <div>£{line.min_payment_gbp.toLocaleString()}</div>
             {isInsufficient && (
              <div className="text-xs text-amber-600 mt-1">
               Interest ≈ £{interestGbp.toLocaleString()}/mo
              </div>
             )}
            </td>
           <td className="text-right py-3 px-2">
            <span className={line.extra_payment_gbp > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
             £{line.extra_payment_gbp.toLocaleString()}
            </span>
           </td>
           <td className="text-right py-3 px-2 font-medium text-gray-900">
            £{line.total_payment_gbp.toLocaleString()}
           </td>
           <td className="text-right py-3 px-2 text-gray-600">
            £{line.remaining_balance_gbp.toLocaleString()}
           </td>
          </tr>
         );
         })}
        </tbody>
       </table>
      </div>

      {paymentPlan.lines.length === 0 && (
       <div className="text-center py-8 text-gray-500">
        No active debts to plan payments for
       </div>
      )}
     </Card>
    </div>
   </div>

   {/* Toast notification */}
   {showToast && (
    <div className="fixed bottom-4 right-4 z-50">
     <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
      <CheckCircle className="h-5 w-5 flex-shrink-0" />
      <span className="font-medium">{toastMessage}</span>
     </div>
    </div>
   )}
  </div>
 );
}