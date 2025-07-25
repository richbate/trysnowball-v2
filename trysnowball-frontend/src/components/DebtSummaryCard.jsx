import React from 'react';

const DebtSummaryCard = ({ debts, totalDebt, totalMinPayments }) => {
  // Calculate credit utilization
  const debtsWithLimits = debts.filter(debt => debt.limit && debt.limit > 0);
  const totalDebtWithLimits = debtsWithLimits.reduce((sum, debt) => sum + debt.amount, 0);
  const totalLimits = debtsWithLimits.reduce((sum, debt) => sum + debt.limit, 0);
  const utilizationPercent = totalLimits > 0 ? (totalDebtWithLimits / totalLimits) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Debt Summary</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Debt:</span>
          <span className="font-semibold text-red-600">£{totalDebt.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Min Payments:</span>
          <span className="font-semibold">£{totalMinPayments.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Number of Debts:</span>
          <span className="font-semibold">{debts.length}</span>
        </div>
        
        {/* Credit Utilization */}
        {debtsWithLimits.length > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Credit Utilization:</span>
            <span className={`font-semibold ${
              utilizationPercent < 30 ? 'text-green-600' : 
              utilizationPercent < 75 ? 'text-yellow-600' : 
              'text-red-600'
            }`}>
              {utilizationPercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtSummaryCard;