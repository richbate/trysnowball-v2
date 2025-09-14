/**
 * BurnUpCard Component
 * Shows debt payoff progress with step-line chart and projections
 */

import React, { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';
import { buildDebtBurnUp, projectDebtBurnUp, formatChartDate, formatChartCurrency, getCurrentMonthName } from '../../utils/burnup';
import { localDebtStore } from '../../data/localDebtStore';
import { secureAnalytics } from '../../utils/secureAnalytics';

export default function BurnUpCard({
 debt,
 extraPoundsForThisDebt = 0,
 title = "Debt Elimination Timeline"
}) {
 const [paymentHistory, setPaymentHistory] = React.useState([]);
 const [loading, setLoading] = React.useState(true);

 // Load payment history for this debt
 useEffect(() => {
  async function loadPayments() {
   if (!debt?.id) return;
   
   try {
    const payments = await localDebtStore.listPaymentEntries(debt.id);
    setPaymentHistory(payments || []);
   } catch (error) {
    console.error('Failed to load payment history:', error);
    setPaymentHistory([]);
   } finally {
    setLoading(false);
   }
  }
  
  loadPayments();
 }, [debt?.id]);

 // Track analytics
 useEffect(() => {
  if (debt?.id) {
   secureAnalytics.trackEvent('burnup_viewed', { debt_id: debt.id });
  }
 }, [debt?.id]);

 // Build burn-up model
 const burnUpModel = React.useMemo(() => {
  if (!debt) return null;
  
  return buildDebtBurnUp({
   id: debt.id,
   amount_pennies: debt.amount_pennies || 0,
   original_amount_pennies: debt.original_amount_pennies,
   min_payment_pennies: debt.min_payment_pennies || 0,
   payment_history: paymentHistory
  });
 }, [debt, paymentHistory]);

 // Build projection
 const projection = React.useMemo(() => {
  if (!burnUpModel || !debt) return null;
  
  const proj = projectDebtBurnUp(burnUpModel, debt, extraPoundsForThisDebt);
  
  // Track projection analytics
  if (extraPoundsForThisDebt > 0) {
   secureAnalytics.trackEvent('burnup_projection', { 
    debt_id: debt.id, 
    extra_pounds: extraPoundsForThisDebt 
   });
  }
  
  return proj;
 }, [burnUpModel, debt, extraPoundsForThisDebt]);

 if (loading) {
  return (
   <Card className="p-6">
    <div className="animate-pulse">
     <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
     <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
     <div className="h-48 bg-gray-200 rounded"></div>
    </div>
   </Card>
  );
 }

 if (!debt || !burnUpModel) {
  return (
   <Card className="p-6">
    <div className="text-center text-gray-500">
     <h3 className="text-lg font-semibold mb-2">No Target Debt</h3>
     <p className="text-sm">Add debts to see your progress chart</p>
    </div>
   </Card>
  );
 }

 // Get actual APR for this debt for accurate interest calculation
 const debtAPR = (debt.apr || debt.interest || debt.rate || 15) / 100; // Convert to decimal

 // Prepare chart data focused on debt elimination timeline
 const actualData = burnUpModel.points.map((point, index) => ({
  ...point,
  formattedDate: formatChartDate(point.date),
  type: 'actual',
  isPayment: index > 0, // First point is start, rest are payments
  remainingDebt: Math.max(0, burnUpModel.goalPounds - point.paid), // Debt elimination progress
  interestPaid: point.paid * debtAPR // Use actual debt APR for interest portion
 }));

 const projectedData = (projection?.projectedPoints || []).map(point => ({
  ...point,
  formattedDate: formatChartDate(point.date),
  type: 'projected',
  isPayment: true,
  remainingDebt: Math.max(0, burnUpModel.goalPounds - point.paid), // Debt elimination progress
  interestPaid: point.paid * debtAPR // Use actual debt APR for interest portion
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
     <p className="text-sm text-gray-600">{debt.name}</p>
     <p className="text-xs text-gray-500">Current month: {currentMonth}</p>
    </div>
    <div className="text-right">
     <div className="text-sm text-gray-600">Goal</div>
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
       label={{ value: "Goal", position: "topRight", fontSize: 11 }}
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

   {/* Progress summary */}
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    <div>
     <div className="text-gray-600">Progress</div>
     <div className="font-semibold text-green-600">{progressPercent}%</div>
    </div>
    <div>
     <div className="text-gray-600">Paid So Far</div>
     <div className="font-semibold">{formatChartCurrency(paidAmount)}</div>
    </div>
    <div>
     <div className="text-gray-600">Remaining</div>
     <div className="font-semibold text-orange-600">{formatChartCurrency(remainingAmount)}</div>
    </div>
    <div>
     <div className="text-gray-600">Projected Finish</div>
     <div className="font-semibold text-blue-600">{projectedEndLabel}</div>
    </div>
   </div>

   {extraPoundsForThisDebt > 0 && (
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
     <div className="text-sm text-blue-800">
      <span className="font-medium">💪 Extra firepower:</span> {formatChartCurrency(extraPoundsForThisDebt)}/month 
      accelerating your progress
     </div>
    </div>
   )}

   {/* Total Repayment Summary */}
   <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    <div className="text-sm text-blue-800">
     <span className="font-medium">💰 Total Repayment:</span> Over {projection?.projectedEndDate ?
      Math.ceil((new Date(projection.projectedEndDate) - new Date()) / (1000 * 60 * 60 * 24 * 30.44)) : '—'
     } months, you'll repay {formatChartCurrency(goalAmount - paidAmount)} remaining + {formatChartCurrency(goalAmount * debtAPR)} estimated interest = {formatChartCurrency((goalAmount - paidAmount) + (goalAmount * debtAPR))} total
    </div>
   </div>

   {paymentHistory.length === 0 && (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
     <div className="text-sm text-gray-600">
      <span className="font-medium">🎯 Ready to start:</span> Record your first payment to see progress on the chart
     </div>
    </div>
   )}
  </Card>
 );
}