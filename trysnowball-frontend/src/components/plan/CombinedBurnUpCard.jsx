/**
 * CombinedBurnUpCard Component
 * Shows total debt portfolio payoff progress with step-line chart
 */

import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { buildCombinedDebtBurnUp, projectCombinedDebtBurnUp, formatChartDate, formatChartCurrency, getCurrentMonthName } from '../../utils/burnup';
import { localDebtStore } from '../../data/localDebtStore';
import { secureAnalytics } from '../../utils/secureAnalytics';
import { fromCents } from '../../lib/money';

export default function CombinedBurnUpCard({ 
 debts = [], 
 totalExtraPounds = 0,
 strategy = 'snowball',
 customFocusId = null,
 title = "Total Debt Elimination Timeline" 
}) {
 const [allPaymentHistories, setAllPaymentHistories] = React.useState({});
 const [loading, setLoading] = React.useState(true);

 // Load payment histories for all debts
 useEffect(() => {
  async function loadAllPayments() {
   if (!debts.length) return;
   
   try {
    const histories = {};
    await Promise.all(
     debts.map(async (debt) => {
      const payments = await localDebtStore.listPaymentEntries(debt.id);
      histories[debt.id] = payments || [];
     })
    );
    setAllPaymentHistories(histories);
   } catch (error) {
    console.error('Failed to load payment histories:', error);
    setAllPaymentHistories({});
   } finally {
    setLoading(false);
   }
  }
  
  loadAllPayments();
 }, [debts]);

 // Track analytics
 useEffect(() => {
  if (debts.length > 0) {
   secureAnalytics.trackEvent('combined_burnup_viewed', { 
    debt_count: debts.length,
    total_extra_pounds: totalExtraPounds
   });
  }
 }, [debts.length, totalExtraPounds]);

 // Build combined burn-up model
 const burnUpModel = React.useMemo(() => {
  if (!debts.length) return null;
  
  // Add payment histories to debts
  const debtsWithHistory = debts.map(debt => ({
   ...debt,
   payment_history: allPaymentHistories[debt.id] || []
  }));
  
  return buildCombinedDebtBurnUp(debtsWithHistory);
 }, [debts, allPaymentHistories]);

 // Build projection
 const projection = React.useMemo(() => {
  if (!burnUpModel || !debts.length) return null;
  
  return projectCombinedDebtBurnUp(
   burnUpModel, 
   debts, 
   totalExtraPounds, 
   strategy, 
   customFocusId
  );
 }, [burnUpModel, debts, totalExtraPounds, strategy, customFocusId]);

 if (loading) {
  return (
   <Card className="p-6">
    <div className="animate-pulse">
     <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
     <div className="h-3 bg-gray-200 rounded w-1/3 mb-4"></div>
     <div className="h-48 bg-gray-200 rounded"></div>
    </div>
   </Card>
  );
 }

 if (!debts.length || !burnUpModel) {
  return (
   <Card className="p-6">
    <div className="text-center text-gray-500">
     <h3 className="text-lg font-semibold mb-2">No Debts Found</h3>
     <p className="text-sm">Add debts to see your total progress chart</p>
    </div>
   </Card>
  );
 }

 // Calculate weighted average APR for interest estimation
 const totalDebtCents = debts.reduce((sum, d) => sum + (d.amount_pennies || 0), 0);
 const weightedAPR = totalDebtCents > 0
  ? debts.reduce((sum, d) => {
     const apr = d.apr || d.interest || d.rate || 15; // Default to 15% if no APR provided
     const weight = (d.amount_pennies || 0) / totalDebtCents;
     return sum + (apr * weight);
    }, 0) / 100
  : 0.15; // Default 15% APR

 // Prepare chart data focused on debt elimination timeline
 const actualData = burnUpModel.points.map((point, index) => ({
  ...point,
  formattedDate: formatChartDate(point.date),
  type: 'actual',
  isPayment: index > 0,
  remainingDebt: Math.max(0, burnUpModel.goalPounds - point.paid), // Debt elimination progress
  interestPaid: point.paid * weightedAPR // Use weighted average APR for interest portion
 }));

 const projectedData = (projection?.projectedPoints || []).map(point => ({
  ...point,
  formattedDate: formatChartDate(point.date),
  type: 'projected',
  isPayment: true,
  remainingDebt: Math.max(0, burnUpModel.goalPounds - point.paid), // Debt elimination progress
  interestPaid: point.paid * weightedAPR // Use weighted average APR for interest portion
 }));

 // Combine for continuous line
 const allData = [...actualData, ...projectedData];

 const goalAmount = burnUpModel.goalPounds;
 const paidAmount = burnUpModel.totalPaidPounds;
 const progressPercent = goalAmount > 0 ? Math.min(100, Math.round((paidAmount / goalAmount) * 100)) : 0;
 const remainingAmount = Math.max(0, goalAmount - paidAmount);
 
 const projectedEndLabel = projection?.projectedEndDate 
  ? new Date(projection.projectedEndDate).toLocaleDateString('en-GB', { 
    month: 'long', 
    year: 'numeric' 
   })
  : '—';

 const currentMonth = getCurrentMonthName();
 const totalDebts = debts.length;
 const totalCurrentBalance = debts.reduce((sum, debt) => sum + fromCents(debt.amount_pennies || 0), 0);
 const totalMinPayments = debts.reduce((sum, debt) => sum + fromCents(debt.min_payment_pennies || 0), 0);

 // Simplified tooltip focused on debt elimination
 const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
   const data = payload[0].payload;
   return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
     <p className="font-medium">{formatChartDate(data.date)}</p>
     <p className="text-red-600">
      <span className="font-medium">Remaining Debt: </span>
      {formatChartCurrency(data.remainingDebt)}
     </p>
     <p className="text-yellow-600">
      <span className="font-medium">Interest Paid: </span>
      {formatChartCurrency(data.interestPaid)}
     </p>
     {data.type === 'projected' && (
      <p className="text-sm text-gray-500">Projected</p>
     )}
    </div>
   );
  }
  return null;
 };

 return (
  <Card className="p-6">
   <div className="flex items-baseline justify-between mb-4">
    <div>
     <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
     <p className="text-sm text-gray-600">{totalDebts} debts • Current month: {currentMonth}</p>
    </div>
    <div className="text-right">
     <div className="text-sm text-gray-600">Total Goal</div>
     <div className="font-medium text-lg">{formatChartCurrency(goalAmount)}</div>
    </div>
   </div>

   <div className="h-56 mb-4">
    <ResponsiveContainer width="100%" height="100%">
     <LineChart data={allData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <XAxis 
       dataKey="formattedDate" 
       tick={{ fontSize: 11 }}
       minTickGap={30}
      />
      <YAxis 
       tick={{ fontSize: 11 }}
       tickFormatter={formatChartCurrency}
      />
      <Tooltip content={<CustomTooltip />} />
      
      {/* Goal reference line */}
      <ReferenceLine 
       y={goalAmount} 
       stroke="#9CA3AF" 
       strokeDasharray="3 3" 
       label={{ value: "Total Goal", position: "topRight", fontSize: 11 }}
      />
      
      {/* Interest paid line (actual) - increasing line */}
      <Line
       dataKey="interestPaid"
       stroke="#F59E0B"
       strokeWidth={3}
       type="stepAfter"
       dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
       activeDot={{ r: 6, fill: '#F59E0B' }}
       isAnimationActive={false}
       connectNulls={false}
       data={actualData}
      />

      {/* Interest paid projection (dashed) */}
      {projectedData.length > 0 && (
       <Line
        dataKey="interestPaid"
        stroke="#FCD34D"
        strokeWidth={2}
        strokeDasharray="5 5"
        type="stepAfter"
        dot={{ fill: '#FCD34D', strokeWidth: 1, r: 3 }}
        isAnimationActive={false}
        connectNulls={false}
        data={projectedData}
       />
      )}

      {/* Remaining debt line (actual) - decreasing line */}
      <Line
       dataKey="remainingDebt"
       stroke="#DC2626"
       strokeWidth={3}
       type="stepAfter"
       dot={{ fill: '#DC2626', strokeWidth: 2, r: 4 }}
       activeDot={{ r: 6, fill: '#DC2626' }}
       isAnimationActive={false}
       connectNulls={false}
       data={actualData}
      />

      {/* Remaining debt projection (dashed) */}
      {projectedData.length > 0 && (
       <Line
        dataKey="remainingDebt"
        stroke="#F87171"
        strokeWidth={2}
        strokeDasharray="5 5"
        type="stepAfter"
        dot={{ fill: '#F87171', strokeWidth: 1, r: 3 }}
        isAnimationActive={false}
        connectNulls={false}
        data={projectedData}
       />
      )}
     </LineChart>
    </ResponsiveContainer>
   </div>

   {/* Enhanced progress summary */}
   <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
    <div>
     <div className="text-gray-600">Progress</div>
     <div className="font-semibold text-green-600">{progressPercent}%</div>
    </div>
    <div>
     <div className="text-gray-600">Total Paid</div>
     <div className="font-semibold">{formatChartCurrency(paidAmount)}</div>
    </div>
    <div>
     <div className="text-gray-600">Remaining</div>
     <div className="font-semibold text-orange-600">{formatChartCurrency(remainingAmount)}</div>
    </div>
    <div>
     <div className="text-gray-600">Current Balance</div>
     <div className="font-semibold text-red-600">{formatChartCurrency(totalCurrentBalance)}</div>
    </div>
    <div>
     <div className="text-gray-600">Debt Free</div>
     <div className="font-semibold text-blue-600">{projectedEndLabel}</div>
    </div>
   </div>

   <div className="grid grid-cols-2 gap-4 text-sm">
    <div>
     <div className="text-gray-600">Min Payments/Month</div>
     <div className="font-semibold">{formatChartCurrency(totalMinPayments)}</div>
    </div>
    <div>
     <div className="text-gray-600">Extra Budget/Month</div>
     <div className="font-semibold text-green-600">{formatChartCurrency(totalExtraPounds)}</div>
    </div>
   </div>

   {totalExtraPounds > 0 && (
    <div className="mt-4 p-3 bg-green-50 rounded-lg">
     <div className="text-sm text-green-800">
      <span className="font-medium">🚀 Total firepower:</span> {formatChartCurrency(totalMinPayments + totalExtraPounds)}/month 
      across {totalDebts} debts
     </div>
    </div>
   )}

   {/* Total Repayment Summary */}
   <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <div className="text-sm text-blue-800">
     <span className="font-medium">💰 Total Repayment:</span> Over {projection?.projectedEndDate ?
      Math.ceil((new Date(projection.projectedEndDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.44)) : '—'
     } months, you'll repay {formatChartCurrency(totalCurrentBalance)} debt + {formatChartCurrency(goalAmount * weightedAPR)} estimated interest = {formatChartCurrency(totalCurrentBalance + (goalAmount * weightedAPR))} total
    </div>
   </div>

   {paidAmount === 0 && (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
     <div className="text-sm text-gray-600">
      <span className="font-medium">📊 Portfolio view:</span> Start recording payments to see your combined progress across all debts
     </div>
    </div>
   )}
  </Card>
 );
}