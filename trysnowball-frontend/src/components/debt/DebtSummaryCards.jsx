import React from 'react';
import { formatCurrency } from '../../utils/debtFormatting';

const DebtSummaryCards = ({ totalDebt, totalMinPayments, creditUtilization, loading = false }) => {

  if (totalDebt === 0 && !loading) return null;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <div className="text-base font-medium text-slate-600 mb-2">Total Debt</div>
          <div className="h-9 bg-slate-200 animate-pulse rounded"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <div className="text-base font-medium text-slate-600 mb-2">Monthly Minimums</div>
          <div className="h-9 bg-slate-200 animate-pulse rounded"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
          <div className="text-base font-medium text-slate-600 mb-2">Credit Utilization</div>
          <div className="h-9 bg-slate-200 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="text-base font-medium text-slate-600 mb-2">Total Debt</div>
        <div className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="text-base font-medium text-slate-600 mb-2">Monthly Minimums</div>
        <div className="text-3xl font-bold text-orange-600">{formatCurrency(totalMinPayments)}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
        <div className="text-base font-medium text-slate-600 mb-2">Credit Utilization</div>
        <div className={`text-3xl font-bold ${creditUtilization > 70 ? 'text-red-600' : creditUtilization > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {creditUtilization.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default DebtSummaryCards;