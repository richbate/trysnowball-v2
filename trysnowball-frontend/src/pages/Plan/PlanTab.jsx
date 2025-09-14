/**
 * PlanTab - Your Monthly Payment Plan
 * 
 * Shows actionable monthly payment breakdown with snowball allocation.
 * Replaces the complex AdvancedTab with a simple, execution-focused view.
 */

import React, { useEffect, useState } from 'react';
import { CheckCircle, Calculator, TrendingUp, Snowflake, Target } from 'lucide-react';
import { useUserDebts } from '../../hooks/useUserDebts';
import useSnowballSettings from '../../hooks/useSnowballSettings';
import { useSnowflakeSelectors } from '../../hooks/selectors/useSnowflakeSelectors';
import { formatCurrency } from '../../utils/debtFormatting';
import { track } from '../../lib/analytics';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// PlanHeader Component
const PlanHeader = () => (
  <div className="mb-6">
    <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Monthly Plan</h1>
    <p className="text-lg text-gray-600">See how your payments are allocated this month.</p>
  </div>
);

// PlanSummary Component
const PlanSummary = ({ totalDebt, monthlyMinimums, snowballAmount, snowflakesThisMonth }) => {
  const extraThisMonth = snowballAmount + snowflakesThisMonth;
  
  return (
    <Card className="mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalDebt)}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center">
            <Calculator className="w-4 h-4 mr-1" />
            Total Debt
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyMinimums)}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center">
            <Target className="w-4 h-4 mr-1" />
            Monthly Minimums
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{formatCurrency(snowballAmount)}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Snowball Amount
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(snowflakesThisMonth)}</div>
          <div className="text-sm text-gray-500 flex items-center justify-center">
            <Snowflake className="w-4 h-4 mr-1" />
            Snowflakes This Month
          </div>
        </div>
      </div>
      
      {extraThisMonth > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center text-green-800 font-semibold">
            🎉 You're throwing an extra {formatCurrency(extraThisMonth)} at your debts this month!
          </div>
        </div>
      )}
    </Card>
  );
};

// PlanBreakdownTable Component
const PlanBreakdownTable = ({ debts, snowballAmount }) => {
  // Calculate payment allocations using snowball strategy
  const paymentPlan = React.useMemo(() => {
    if (!debts || debts.length === 0) return [];
    
    // Sort debts by balance for snowball strategy (smallest first)
    const sortedDebts = [...debts].sort((a, b) => {
      const balanceA = a.amount_pennies || (a.balance * 100);
      const balanceB = b.amount_pennies || (b.balance * 100);
      return balanceA - balanceB;
    });
    
    // Allocate snowball amount to smallest debt
    let remainingExtra = snowballAmount;
    
    return sortedDebts.map((debt, index) => {
      const balance = (debt.amount_pennies || (debt.balance * 100)) / 100;
      const minPayment = (debt.min_payment_pennies || (debt.minPayment * 100)) / 100;
      const extraPayment = index === 0 ? remainingExtra : 0; // First debt gets all extra
      const totalPayment = minPayment + extraPayment;
      const remainingAfterPayment = Math.max(0, balance - totalPayment);
      
      return {
        id: debt.id,
        name: debt.name || debt.issuer || 'Unnamed Debt',
        balance,
        minPayment,
        extraPayment,
        totalPayment,
        remainingAfterPayment,
        isFocus: index === 0 && extraPayment > 0
      };
    });
  }, [debts, snowballAmount]);
  
  const totalPlanned = paymentPlan.reduce((sum, debt) => sum + debt.totalPayment, 0);
  
  if (paymentPlan.length === 0) {
    return (
      <Card className="mb-6">
        <div className="text-center py-8 text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Add some debts to see your payment plan</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Payment Breakdown</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-semibold">Debt Name</th>
              <th className="text-right py-2 font-semibold">Balance</th>
              <th className="text-right py-2 font-semibold">Min</th>
              <th className="text-right py-2 font-semibold">Extra</th>
              <th className="text-right py-2 font-semibold">Total</th>
              <th className="text-right py-2 font-semibold">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {paymentPlan.map((debt) => (
              <tr key={debt.id} className="border-b border-gray-100">
                <td className="py-3">
                  <div className="flex items-center">
                    {debt.name}
                    {debt.isFocus && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                        Focus
                      </span>
                    )}
                  </div>
                </td>
                <td className="text-right py-3">{formatCurrency(debt.balance)}</td>
                <td className="text-right py-3">{formatCurrency(debt.minPayment)}</td>
                <td className="text-right py-3">
                  <span className={debt.extraPayment > 0 ? 'text-green-600 font-semibold' : ''}>
                    {formatCurrency(debt.extraPayment)}
                  </span>
                </td>
                <td className="text-right py-3 font-semibold">{formatCurrency(debt.totalPayment)}</td>
                <td className="text-right py-3 text-gray-600">{formatCurrency(debt.remainingAfterPayment)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold">
              <td className="py-3 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Total Planned
              </td>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-right py-3 text-lg">{formatCurrency(totalPlanned)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
};

// PlanCallToAction Component
const PlanCallToAction = ({ onPaymentConfirmed }) => {
  const [confirmed, setConfirmed] = useState(false);
  
  const handleConfirm = () => {
    setConfirmed(true);
    onPaymentConfirmed();
    
    // Track analytics
    track('plan_payment_confirmed', {
      timestamp: Date.now(),
      source: 'plan_tab'
    });
    
    // Reset after 3 seconds
    setTimeout(() => setConfirmed(false), 3000);
  };
  
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Ready to go?</h3>
        <p className="text-gray-600 mb-4">
          Make these payments in your banking app and come back to track progress.
        </p>
        
        <Button 
          onClick={handleConfirm}
          disabled={confirmed}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {confirmed ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Payments Confirmed! 
            </>
          ) : (
            "I made these payments"
          )}
        </Button>
      </div>
    </Card>
  );
};

// Main PlanTab Component
const PlanTab = ({ debts = [] }) => {
  const { snowballAmount } = useSnowballSettings();
  const snowflakeSelectors = useSnowflakeSelectors();
  
  // Calculate totals
  const totalDebt = React.useMemo(() => {
    return debts.reduce((sum, debt) => {
      const balance = (debt.amount_pennies || (debt.balance * 100)) / 100;
      return sum + balance;
    }, 0);
  }, [debts]);
  
  const monthlyMinimums = React.useMemo(() => {
    return debts.reduce((sum, debt) => {
      const minPayment = (debt.min_payment_pennies || (debt.minPayment * 100)) / 100;
      return sum + minPayment;
    }, 0);
  }, [debts]);
  
  // Get snowflakes for current month (simplified - could be enhanced)
  const snowflakesThisMonth = 0; // TODO: Implement actual snowflake calculation
  
  // Track page view
  useEffect(() => {
    track('plan_tab_viewed', {
      debts_count: debts.length,
      total_debt: totalDebt,
      snowball_amount: snowballAmount,
      timestamp: Date.now()
    });
  }, [debts.length, totalDebt, snowballAmount]);
  
  const handlePaymentConfirmed = () => {
    console.log('[PlanTab] Payment confirmed by user');
    // Future: This could trigger payment logging or progress tracking
  };
  
  return (
    <div className="space-y-6 pb-8">
      <PlanHeader />
      
      <PlanSummary 
        totalDebt={totalDebt}
        monthlyMinimums={monthlyMinimums}
        snowballAmount={snowballAmount}
        snowflakesThisMonth={snowflakesThisMonth}
      />
      
      <PlanBreakdownTable 
        debts={debts}
        snowballAmount={snowballAmount}
      />
      
      <PlanCallToAction 
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
};

export default PlanTab;