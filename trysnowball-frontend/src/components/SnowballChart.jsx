import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Helper function to simulate snowball method
const simulateSnowball = (debts, totalPayment) => {
  const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => a.balance - b.balance);
  
  for (let month = 1; month <= 120; month++) {
    let available = totalPayment;
    
    // Pay minimums first
    for (let i = 0; i < snowballDebts.length; i++) {
      const debt = snowballDebts[i];
      if (debt.balance <= 0) continue;
      const interest = debt.balance * (debt.rate / 12 / 100);
      const minPrincipal = Math.max(debt.minPayment - interest, 0);
      debt.balance = Math.max(0, debt.balance - minPrincipal);
      available -= debt.minPayment;
    }
    
    // Apply extra to smallest debt
    if (available > 0) {
      for (let i = 0; i < snowballDebts.length; i++) {
        const debt = snowballDebts[i];
        if (debt.balance > 0) {
          const payment = Math.min(available, debt.balance);
          debt.balance -= payment;
          break;
        }
      }
    }
    
    // Check if all debts are paid
    const totalRemaining = snowballDebts.reduce((sum, debt) => sum + debt.balance, 0);
    if (totalRemaining <= 1) return month;
  }
  
  return -1; // Not paid off within 120 months
};

// Format currency
const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '£0';
  return '£' + Math.round(value).toLocaleString();
};

const SnowballChart = ({ debts, extraPayment = 500, colors }) => {
  const [chartType, setChartType] = useState('line');
  
  // Your real debt data
  const defaultDebts = [
    { name: 'Paypal', balance: 1400, rate: 20, minPayment: 255 },
    { name: 'Flex', balance: 2250, rate: 20, minPayment: 70 },
    { name: 'Barclaycard', balance: 2461, rate: 20, minPayment: 75 },
    { name: 'Virgin', balance: 4762, rate: 20, minPayment: 255 },
    { name: 'MBNA', balance: 5931, rate: 20, minPayment: 255 },
    { name: 'Natwest', balance: 6820, rate: 20, minPayment: 70 },
    { name: 'Halifax 2', balance: 8587, rate: 20, minPayment: 215 },
    { name: 'Halifax 1', balance: 11694, rate: 20, minPayment: 300 },
  ];

  const debtData = debts || defaultDebts;
  const totalMinPayments = debtData.reduce((sum, debt) => sum + debt.minPayment, 0);
  const totalBalance = debtData.reduce((sum, debt) => sum + debt.balance, 0);

  const chartData = useMemo(() => {
    const data = [];
    
    // Calculate minimum payments only scenario
    let minOnlyDebts = JSON.parse(JSON.stringify(debtData));
    let minOnlyBalance = totalBalance;
    
    // Calculate snowball scenario
    let snowballDebts = JSON.parse(JSON.stringify(debtData)).sort((a, b) => a.balance - b.balance);
    let snowballBalance = totalBalance;
    
    for (let month = 0; month <= 60; month++) {
      data.push({
        month,
        minimumOnly: Math.max(0, Math.round(minOnlyBalance)),
        snowball: Math.max(0, Math.round(snowballBalance))
      });
      
      if (month === 60) break;
      
      // Minimum payments simulation
      let minPaymentTotal = 0;
      for (let debt of minOnlyDebts) {
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        const principal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(0, debt.balance - principal);
        minPaymentTotal += debt.minPayment;
      }
      minOnlyBalance = minOnlyDebts.reduce((sum, debt) => sum + debt.balance, 0);
      
      // Snowball simulation
      let snowballPaymentTotal = totalMinPayments + extraPayment;
      let available = snowballPaymentTotal;
      
      // Pay minimums first
      for (let debt of snowballDebts) {
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        const minPrincipal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(0, debt.balance - minPrincipal);
        available -= debt.minPayment;
      }
      
      // Apply extra to smallest debt
      if (available > 0) {
        for (let debt of snowballDebts) {
          if (debt.balance > 0) {
            const payment = Math.min(available, debt.balance);
            debt.balance -= payment;
            break;
          }
        }
      }
      
      snowballBalance = snowballDebts.reduce((sum, debt) => sum + debt.balance, 0);
    }
    
    return data;
  }, [debtData, extraPayment, totalBalance, totalMinPayments]);

  // Calculate payoff months
  const minimumPayoffMonths = simulateSnowball(debtData, totalMinPayments);
  const snowballPayoffMonths = simulateSnowball(debtData, totalMinPayments + extraPayment);

  // Calculate savings
  const totalInterestMinimum = useMemo(() => {
    let total = 0;
    const debts = JSON.parse(JSON.stringify(debtData));
    
    for (let month = 0; month < (minimumPayoffMonths > 0 ? minimumPayoffMonths : 120); month++) {
      for (let debt of debts) {
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        total += interest;
        const principal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(0, debt.balance - principal);
      }
    }
    
    return total;
  }, [debtData, minimumPayoffMonths]);

  const totalInterestSnowball = useMemo(() => {
    let total = 0;
    const debts = JSON.parse(JSON.stringify(debtData)).sort((a, b) => a.balance - b.balance);
    
    for (let month = 0; month < (snowballPayoffMonths > 0 ? snowballPayoffMonths : 120); month++) {
      let available = totalMinPayments + extraPayment;
      
      // Calculate and add interest, pay minimums
      for (let debt of debts) {
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        total += interest;
        const minPrincipal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(0, debt.balance - minPrincipal);
        available -= debt.minPayment;
      }
      
      // Apply extra to smallest debt
      if (available > 0) {
        for (let debt of debts) {
          if (debt.balance > 0) {
            const payment = Math.min(available, debt.balance);
            debt.balance -= payment;
            break;
          }
        }
      }
    }
    
    return total;
  }, [debtData, snowballPayoffMonths, totalMinPayments, extraPayment]);

  const interestSaved = totalInterestMinimum - totalInterestSnowball;

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex justify-between items-center">
        <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
          Snowball Chart - Your Debt Freedom Projection
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              chartType === 'line' 
                ? 'bg-primary text-white' 
                : `${colors.text.secondary} hover:${colors.surfaceSecondary}`
            }`}
          >
            Line View
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className={`p-6 ${colors.surface} rounded-lg border ${colors.border}`}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              type="number"
              domain={[0, 60]}
              tickFormatter={(value) => `${value}m`}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              formatter={(value, name) => [
                formatCurrency(value),
                name === 'minimumOnly' ? 'Minimum Payments Only' : `Snowball Method (+£${extraPayment})`
              ]}
              labelFormatter={(value) => `Month ${value}`}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="minimumOnly" 
              stroke="#f59e0b" 
              strokeWidth={2} 
              dot={false}
              name="Minimum Payments Only"
            />
            <Line 
              type="monotone" 
              dataKey="snowball" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
              name={`Snowball Method (+£${extraPayment})`}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 ${colors.surface} rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-amber-600">
            {minimumPayoffMonths > 0 ? `${minimumPayoffMonths} months` : '10+ years'}
          </div>
          <div className={`text-sm ${colors.text.muted}`}>Minimum Payments Only</div>
          <div className={`text-xs ${colors.text.muted} mt-1`}>
            Total Interest: {formatCurrency(totalInterestMinimum)}
          </div>
        </div>

        <div className={`p-4 ${colors.surface} rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-green-600">
            {snowballPayoffMonths > 0 ? `${snowballPayoffMonths} months` : '10+ years'}
          </div>
          <div className={`text-sm ${colors.text.muted}`}>Snowball Method</div>
          <div className={`text-xs ${colors.text.muted} mt-1`}>
            Total Interest: {formatCurrency(totalInterestSnowball)}
          </div>
        </div>

        <div className={`p-4 ${colors.surface} rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(interestSaved)}
          </div>
          <div className={`text-sm ${colors.text.muted}`}>Interest Saved</div>
          <div className={`text-xs ${colors.text.muted} mt-1`}>
            {minimumPayoffMonths - snowballPayoffMonths} months faster
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnowballChart;