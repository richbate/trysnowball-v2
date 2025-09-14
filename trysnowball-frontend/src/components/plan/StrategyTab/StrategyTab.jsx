import React, { useState, useMemo } from 'react';
import NoDebtsState from '../../../components/NoDebtsState';
import Button from '../../../components/ui/Button';
import BurnUpCard from '../BurnUpCard';
import CombinedBurnUpCard from '../CombinedBurnUpCard';
import { formatCurrency } from '../../../utils/debtFormatting';
import { usePaymentPrefs } from '../../../hooks/usePaymentPrefs';
import { selectTargetDebt } from '../../../utils/burnup';
import { computePaymentPlan } from '../../../utils/paymentPlanner';
import { toCents, fromCents } from '../../../lib/money';

const StrategyTab = ({ colors, timelineDebtsData, demoDataCleared, hasNoDebtData, currentStrategy = 'snowball', onStrategyChange }) => {
 // Safe fallback for colors prop
 const safeColors = colors || {
  background: 'bg-gray-50',
  surface: 'bg-white',
  surfaceSecondary: 'bg-gray-50', 
  border: 'border-gray-200',
  text: {
   primary: 'text-gray-900',
   secondary: 'text-gray-600',
   muted: 'text-gray-500'
  }
 };

 if (hasNoDebtData) {
  return (
   <NoDebtsState 
    title="Ready to Build Your Strategy"
    subtitle="Add your debts and we'll create a personalized payoff plan."
    icon="🎯"
   />
  );
 }

 // Chart view toggle state
 const [showCombinedView, setShowCombinedView] = useState(false);
 
 // Use shared payment preferences
 const { prefs } = usePaymentPrefs();
 const { strategy, customFocusId, extraPounds } = prefs;
 
 // Get active debts and determine target debt using shared logic
 const activeDebts = (timelineDebtsData || []).filter(debt => (debt.amount_pennies || 0) > 0);
 const targetDebt = selectTargetDebt(activeDebts, strategy, customFocusId);

 // Compute payment plan to get accurate allocation to target debt
 const paymentPlan = useMemo(() => {
  if (!activeDebts.length || !extraPounds) return null;
  return computePaymentPlan(activeDebts, extraPounds, strategy, customFocusId);
 }, [activeDebts, extraPounds, strategy, customFocusId]);

 // Get the actual extra amount allocated to the target debt
 const extraForTargetPounds = useMemo(() => {
  if (!targetDebt || !paymentPlan) return 0;
  const targetLine = paymentPlan.lines.find(line => line.debt_id === targetDebt.id);
  return targetLine ? fromCents(targetLine.extra_payment_cents) : 0;
 }, [targetDebt, paymentPlan]);

 return (
  <div className="space-y-6">
   <div className="flex items-center justify-between">
    <h2 className={`text-xl font-semibold ${safeColors.text.primary}`}>Your Payoff Strategy</h2>
    
    {/* Chart View Toggle */}
    {activeDebts.length > 1 && (
     <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Chart view:</span>
      <button
       onClick={() => setShowCombinedView(false)}
       className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        !showCombinedView 
         ? 'bg-blue-100 text-blue-700' 
         : 'text-gray-600 hover:text-gray-900'
       }`}
      >
       Target Debt
      </button>
      <button
       onClick={() => setShowCombinedView(true)}
       className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
        showCombinedView 
         ? 'bg-blue-100 text-blue-700' 
         : 'text-gray-600 hover:text-gray-900'
       }`}
      >
       All Debts
      </button>
     </div>
    )}
   </div>
   
   {/* BurnUp Charts */}
   {showCombinedView && activeDebts.length > 0 ? (
    <CombinedBurnUpCard
     debts={activeDebts}
     totalExtraPounds={extraPounds}
     strategy={strategy}
     customFocusId={customFocusId}
     title="Total Debt Elimination Timeline"
    />
   ) : targetDebt && (
    <BurnUpCard
     debt={targetDebt}
     extraPoundsForThisDebt={extraForTargetPounds}
     title="Target Debt Elimination Timeline"
    />
   )}
   
   {/* Strategy Selection */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className={`p-6 border-2 rounded-lg ${safeColors.surface} ${
     currentStrategy === 'snowball' ? 'border-primary' : 'border-gray-200 opacity-60'
    }`}>
     <div className="flex items-center space-x-3 mb-4">
      <div className="text-2xl">❄️</div>
      <div>
       <h3 className="text-lg font-semibold text-primary">Debt Snowball</h3>
       {currentStrategy === 'snowball' ? (
        <div className="px-2 py-1 bg-primary text-white text-xs rounded-full inline-block">SELECTED</div>
       ) : (
        <Button 
         onClick={() => onStrategyChange('snowball')}
         variant="ghost" 
         size="sm" 
         className="text-xs text-primary hover:underline p-0 h-auto min-w-0"
        >
         Switch to Snowball
        </Button>
       )}
      </div>
     </div>
     <p className={`${safeColors.text.secondary} mb-4`}>
      Pay minimums on all debts, then attack the smallest balance first. Quick wins build momentum!
     </p>
     <div className="space-y-2 text-sm">
      <div className="flex justify-between">
       <span>✅ Psychological wins</span>
       <span>✅ Clear motivation</span>
      </div>
      <div className="flex justify-between">
       <span>✅ Simple to follow</span>
       <span>⚠️ More interest paid</span>
      </div>
     </div>
    </div>

    <div className={`p-6 border-2 rounded-lg ${safeColors.surface} ${
     currentStrategy === 'avalanche' ? 'border-primary' : 'border-gray-200 opacity-60'
    }`}>
     <div className="flex items-center space-x-3 mb-4">
      <div className="text-2xl">🏔️</div>
      <div>
       <h3 className="text-lg font-semibold text-primary">Debt Avalanche</h3>
       {currentStrategy === 'avalanche' ? (
        <div className="px-2 py-1 bg-primary text-white text-xs rounded-full inline-block">SELECTED</div>
       ) : (
        <Button 
         onClick={() => onStrategyChange('avalanche')}
         variant="ghost" 
         size="sm" 
         className="text-xs text-primary hover:underline p-0 h-auto min-w-0"
        >
         Switch to Avalanche
        </Button>
       )}
      </div>
     </div>
     <p className={`${safeColors.text.secondary} mb-4`}>
      Pay minimums on all debts, then attack the highest interest rate first. Mathematically optimal.
     </p>
     <div className="space-y-2 text-sm">
      <div className="flex justify-between">
       <span>✅ Less interest paid</span>
       <span>✅ Faster payoff</span>
      </div>
      <div className="flex justify-between">
       <span>⚠️ Slower motivation</span>
       <span>⚠️ Requires discipline</span>
      </div>
     </div>
    </div>
   </div>

   {/* Current Strategy Details */}
   <div className={`p-6 border rounded-lg ${safeColors.border} bg-primary/5`}>
    <h3 className={`font-semibold ${safeColors.text.primary} mb-4`}>
     Your Focus Order 
     ({currentStrategy === 'avalanche' ? 'Highest Rate First' : 'Smallest Balance First'})
    </h3>
    <div className="space-y-3">
     {(timelineDebtsData || [])
      .filter(debt => debt.amount_pennies > 0) // Only show debts with balances
      .sort((a, b) => {
       if (currentStrategy === 'avalanche') {
        // Sort by interest rate (highest first)
        return (b.interest || b.rate || 0) - (a.interest || a.rate || 0);
       } else {
        // Sort by balance (smallest first) - snowball
        return (a.amount_pennies || 0) - (b.amount_pennies || 0);
       }
      })
      .map((debt, index) => {
       const order = index + 1;
       const status = index === 0 ? 'next' : index === 1 ? 'almost' : 'future';
       const progress = debt.progress || 'neutral';
       
       return (
      <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
       status === 'next' ? 'bg-green-50 border border-green-200' :
       status === 'almost' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
      }`}>
       <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
         status === 'next' ? 'bg-green-500 text-white' :
         status === 'almost' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
         {order}
        </div>
        <div>
         <div className="font-medium">{debt.name}</div>
         <div className="text-sm text-gray-600">
          {formatCurrency(fromCents(debt.amount_pennies || 0))} 
          {currentStrategy === 'avalanche' && (
           <span className="ml-2">• {debt.interest || debt.rate || 0}% APR</span>
          )}
         </div>
         <div className={`text-xs ${
          progress === 'excellent' ? 'text-green-600' :
          progress === 'good' ? 'text-blue-600' : 'text-red-600'
         }`}>
          {progress === 'excellent' ? '📉 Great progress' :
           progress === 'good' ? '↘️ Making progress' : '📈 Balance increased'}
         </div>
        </div>
       </div>
       {status === 'next' && (
        <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
         ATTACK THIS
        </div>
       )}
       {status === 'almost' && (
        <div className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
         NEXT UP
        </div>
       )}
      </div>
       );
      })}
    </div>
    
    {/* Strategy Note */}
    <div className={`mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg`}>
     <p className="text-sm text-blue-800">
      <strong>💡 Keep Going:</strong> Focus all extra payments on your first target. When it's gone, roll that payment to the next debt. Simple!
     </p>
    </div>
   </div>
  </div>
 );
};

export default StrategyTab;