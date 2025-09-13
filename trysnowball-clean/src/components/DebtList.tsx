/**
 * Clean UK Debt List Component
 * Zero conversion, displays exact values from API
 */

import React from 'react';
import { UKDebt } from '../types/UKDebt';

interface DebtListProps {
  debts: UKDebt[];
  onEdit: (debt: UKDebt) => void;
  onDelete: (id: string) => void;
}

const DebtList: React.FC<DebtListProps> = ({ debts, onEdit, onDelete }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatPercent = (rate: number): string => {
    return `${rate.toFixed(1)}%`;
  };

  if (debts.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No debts yet</h3>
        <p className="text-gray-600">Add your first debt to get started with your debt-free journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {debts.map((debt) => (
        <div
          key={debt.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {debt.name}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Balance:</span>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(debt.amount)}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-500">Min Payment:</span>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(debt.min_payment)}
                  </p>
                </div>
                
                <div>
                  <span className="text-gray-500">APR:</span>
                  <p className="font-medium text-gray-900">
                    {formatPercent(debt.apr)}
                  </p>
                </div>
              </div>

              {debt.limit && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Credit Limit:</span>
                  <span className="font-medium text-gray-900 ml-1">
                    {formatCurrency(debt.limit)}
                  </span>
                </div>
              )}

              {debt.original_amount && debt.original_amount !== debt.amount && (
                <div className="mt-2">
                  <div className="text-sm text-gray-500">
                    Progress: {formatCurrency(debt.original_amount - debt.amount)} paid off
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-success h-2 rounded-full"
                      style={{
                        width: `${((debt.original_amount - debt.amount) / debt.original_amount) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 ml-4">
              <button
                onClick={() => onEdit(debt)}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
              >
                Edit
              </button>
              
              <button
                onClick={() => onDelete(debt.id)}
                className="px-4 py-2 text-sm font-medium text-danger border border-danger rounded-md hover:bg-danger hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DebtList;