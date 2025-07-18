import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataManager } from '../hooks/useDataManager';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Generate realistic random debt data
const generateRandomDebts = () => {
  const debtTypes = [
    { name: 'Barclaycard', minRate: 18, maxRate: 29, minLimit: 1500, maxLimit: 5000 },
    { name: 'Halifax Credit Card', minRate: 16, maxRate: 25, minLimit: 2000, maxLimit: 8000 },
    { name: 'MBNA Card', minRate: 19, maxRate: 27, minLimit: 3000, maxLimit: 12000 },
    { name: 'Virgin Money', minRate: 17, maxRate: 24, minLimit: 2500, maxLimit: 6000 },
    { name: 'Tesco Clubcard', minRate: 22, maxRate: 35, minLimit: 1000, maxLimit: 3500 },
    { name: 'Personal Loan', minRate: 6, maxRate: 15, minLimit: 5000, maxLimit: 20000 },
    { name: 'Car Finance', minRate: 3, maxRate: 12, minLimit: 8000, maxLimit: 30000 },
    { name: 'Overdraft', minRate: 25, maxRate: 40, minLimit: 500, maxLimit: 2500 },
    { name: 'PayPal Credit', minRate: 0, maxRate: 23, minLimit: 1000, maxLimit: 4000 },
    { name: 'Store Card', minRate: 28, maxRate: 39, minLimit: 500, maxLimit: 2000 }
  ];

  const numDebts = Math.floor(Math.random() * 4) + 4;
  const selectedTypes = [...debtTypes].sort(() => 0.5 - Math.random()).slice(0, numDebts);
  
  return selectedTypes.map((type, index) => {
    const limit = Math.floor(Math.random() * (type.maxLimit - type.minLimit) + type.minLimit);
    const utilizationPercent = Math.random() * 85 + 5;
    const balance = Math.floor(limit * (utilizationPercent / 100));
    const rate = Math.floor(Math.random() * (type.maxRate - type.minRate) + type.minRate);
    const minPayment = Math.max(25, Math.floor(balance * (Math.random() * 0.02 + 0.02)));
    
    return {
      name: type.name,
      balance: Math.round(balance),
      rate,
      minPayment: Math.round(minPayment * 100) / 100,
    };
  });
};


// Format currency
const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '£0';
  return '£' + Math.round(value).toLocaleString();
};

// Helper function to simulate snowball method for target calculation
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

// Calculate required extra payment for target months
const calculateExtraPaymentForTarget = (targetMonths, debts, totalMinPayments) => {
  if (targetMonths <= 0) return 0;
  
  let low = 0;
  let high = 2000;
  let bestExtra = 0;
  
  while (low <= high) {
    const midExtra = Math.floor((low + high) / 2);
    const testPayoffMonths = simulateSnowball(debts, totalMinPayments + midExtra);
    
    if (testPayoffMonths > 0 && testPayoffMonths <= targetMonths) {
      bestExtra = midExtra;
      high = midExtra - 1;
    } else {
      low = midExtra + 1;
    }
  }
  
  return bestExtra;
};

// Main component
const WhatIfMachine = () => {
  const navigate = useNavigate();
  const { debts: rawDebts, totalDebt, totalMinPayments } = useDataManager();
  const [extraPayment, setExtraPayment] = useState(100);
  const [showSnowballSuccess, setShowSnowballSuccess] = useState(false);
  const [chartType, setChartType] = useState('line'); // 'line' or 'stacked'

  // Transform debt data to match What If Machine format (balance, rate, minPayment)
  // If no real debts exist, use demo data for testing
  const debts = rawDebts.length > 0 ? rawDebts.map(debt => ({
    id: debt.id,
    name: debt.name,
    balance: debt.amount,
    rate: debt.interest,
    minPayment: debt.regularPayment,
    isDemo: debt.isDemo || false
  })) : generateRandomDebts().map(debt => ({ ...debt, isDemo: true }));


  // Remove SpendAnalyser integration - now using manual input only

  const scenarios = useMemo(() => {
    const scenarioResults = {};

    // Do Nothing (interest only)
    const doNothingData = [];
    for (let month = 0; month <= 60; month++) {
      const total = debts.reduce((acc, debt) => {
        const monthlyRate = debt.rate / 12 / 100;
        const futureBalance = debt.balance * Math.pow(1 + monthlyRate, month);
        return acc + futureBalance;
      }, 0);
      doNothingData.push({ month, balance: Math.round(total) });
    }
    scenarioResults.doNothing = doNothingData;

    // Minimum Payments
    const minDebts = JSON.parse(JSON.stringify(debts));
    const minimumOnlyData = [];
    let totalMinInterest = 0;

    for (let month = 0; month <= 120; month++) {
      const total = minDebts.reduce((acc, debt) => acc + debt.balance, 0);
      minimumOnlyData.push({ month, balance: Math.round(total), interestPaid: totalMinInterest });

      if (total <= 1) break;

      for (let i = 0; i < minDebts.length; i++) {
        const debt = minDebts[i];
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        totalMinInterest += interest;
        const principal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(debt.balance - principal, 0);
      }
    }
    scenarioResults.minimumOnly = minimumOnlyData;

    // Snowball Method
    const snowballDebts = JSON.parse(JSON.stringify(debts)).sort((a, b) => a.balance - b.balance);
    const snowballData = [];
    let totalSnowballInterest = 0;

    for (let month = 0; month <= 120; month++) {
      const total = snowballDebts.reduce((acc, debt) => acc + debt.balance, 0);
      snowballData.push({ month, balance: Math.round(total), interestPaid: totalSnowballInterest });
      
      if (total <= 1) break;

      let available = totalMinPayments + extraPayment;

      for (let i = 0; i < snowballDebts.length; i++) {
        const debt = snowballDebts[i];
        if (debt.balance <= 0) continue;
        const interest = debt.balance * (debt.rate / 12 / 100);
        totalSnowballInterest += interest;
        const minPrincipal = Math.max(debt.minPayment - interest, 0);
        debt.balance = Math.max(0, debt.balance - minPrincipal);
        available -= debt.minPayment;
      }

      if (available > 0) {
        for (let i = 0; i < snowballDebts.length; i++) {
          const debt = snowballDebts[i];
          if (debt.balance > 0) {
            const extraPaymentAmount = Math.min(available, debt.balance);
            debt.balance -= extraPaymentAmount;
            break;
          }
        }
      }
    }
    scenarioResults.snowball = snowballData;

    return scenarioResults;
  }, [debts, extraPayment, totalMinPayments]);

  const chartData = [];
  for (let i = 0; i < 61; i++) {
    chartData.push({
      month: i,
      doNothing: scenarios.doNothing[i]?.balance || 0,
      minimumOnly: scenarios.minimumOnly[i]?.balance || 0,
      snowball: scenarios.snowball[i]?.balance || 0,
    });
  }

  // Create stacked chart data showing individual debt balances over time
  const stackedChartData = useMemo(() => {
    if (chartType !== 'stacked') return [];
    
    const stackedData = [];
    const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
    
    // Create a simulation specifically for stacked view
    const stackedSimulation = () => {
      const debtBalances = sortedDebts.map(debt => ({
        name: debt.name,
        balance: debt.balance,
        rate: debt.rate,
        minPayment: debt.minPayment,
        color: colors[sortedDebts.indexOf(debt) % colors.length]
      }));
      
      const monthlyData = [];
      
      for (let month = 0; month < 61; month++) {
        const monthData = { month };
        
        // Add each debt's balance for this month
        debtBalances.forEach(debt => {
          monthData[debt.name] = Math.max(0, debt.balance);
        });
        
        monthlyData.push(monthData);
        
        // Apply snowball method for next month
        if (month < 60) {
          let totalPayment = totalMinPayments + extraPayment;
          
          // Pay minimums first
          debtBalances.forEach(debt => {
            if (debt.balance > 0) {
              const interest = debt.balance * (debt.rate / 12 / 100);
              const principal = Math.max(0, debt.minPayment - interest);
              debt.balance = Math.max(0, debt.balance - principal);
              totalPayment -= debt.minPayment;
            }
          });
          
          // Apply extra payment to smallest debt
          if (totalPayment > 0) {
            for (let debt of debtBalances) {
              if (debt.balance > 0) {
                const payment = Math.min(totalPayment, debt.balance);
                debt.balance -= payment;
                break;
              }
            }
          }
        }
      }
      
      return { monthlyData, debtInfo: debtBalances };
    };
    
    const { monthlyData, debtInfo } = stackedSimulation();
    return { data: monthlyData, debtInfo };
  }, [debts, extraPayment, totalMinPayments, chartType]);

  const snowballPayoffMonths = scenarios.snowball.findIndex((p, index) => index > 0 && p.balance <= 1);
  const minimumPayoffMonths = scenarios.minimumOnly.findIndex((p, index) => index > 0 && p.balance <= 1);
  
  const snowballInterestPaid = scenarios.snowball[snowballPayoffMonths > 0 ? snowballPayoffMonths : scenarios.snowball.length - 1]?.interestPaid || 0;
  const minimumInterestPaid = scenarios.minimumOnly[minimumPayoffMonths > 0 ? minimumPayoffMonths : scenarios.minimumOnly.length - 1]?.interestPaid || 0;

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Snowball Success Notification */}
      {showSnowballSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-md">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold">Spending Analysis Applied! 🎉</p>
              <p className="text-sm opacity-90">£{extraPayment} from your spending analysis</p>
            </div>
            <button 
              onClick={() => setShowSnowballSuccess(false)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">What If Machine</h1>
        <p className="text-center text-gray-600 mb-2">
          Adjust extra payments to see how fast you could be debt-free.
        </p>
        <p className="text-center text-lg font-semibold text-red-600 mb-2">
          Current Total Debt: {formatCurrency(totalDebt)}
        </p>
        <p className="text-center text-lg font-semibold text-blue-600 mb-4">
          Total Snowball Payment: {formatCurrency(totalMinPayments + extraPayment)}/month
        </p>

        {/* Show spending breakdown if available */}
        {localStorage.getItem('trysnowball-spending-breakdown') && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200 max-w-md mx-auto">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm text-green-800 font-medium">From your spending analysis:</p>
              <button
                onClick={() => localStorage.removeItem('trysnowball-spending-breakdown')}
                className="text-xs text-green-600 hover:text-green-800 ml-2"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {JSON.parse(localStorage.getItem('trysnowball-spending-breakdown')).map((item, index) => (
                <div key={index} className="flex justify-between text-sm text-green-700">
                  <span>{item.category}:</span>
                  <span>£{item.potential}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-4 justify-center">
          <label className="font-medium">Extra Payment:</label>
          <input
            type="range"
            min="0"
            max="1100"
            step="25"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="flex-1 max-w-md"
          />
          <span className="text-green-600 font-semibold min-w-16">{formatCurrency(extraPayment)}</span>
        </div>

        {/* Link to Money Helper Budget Tool if no extra payment */}
        {extraPayment === 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-col space-y-3">
              <div>
                <p className="text-sm font-medium text-blue-900">Need help finding extra money?</p>
                <p className="text-xs text-blue-700">Use the Money Helper Budget Planner to discover potential savings</p>
              </div>
              <div className="space-y-2">
                <a
                  href="https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors inline-block"
                >
                  Open Budget Planner →
                </a>
                <p className="text-xs text-blue-600">
                  After completing your budget, return here and enter any extra amount you could put toward debt
                </p>
              </div>
            </div>
          </div>
        )}

        {snowballPayoffMonths > 0 && (
          <div className="text-center mb-6">
            <button 
              onClick={() => {
                const targetMonths = Math.floor(snowballPayoffMonths / 2);
                const requiredExtra = calculateExtraPaymentForTarget(targetMonths, debts, totalMinPayments);
                setExtraPayment(requiredExtra);
              }}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              Cut debt time in half! (Need {formatCurrency(calculateExtraPaymentForTarget(Math.floor(snowballPayoffMonths / 2), debts, totalMinPayments))}/month extra)
            </button>
          </div>
        )}

        {/* Chart Type Toggle */}
        <div className="flex justify-center mb-4">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Line Chart  
            </button>
            <button
              onClick={() => setChartType('stacked')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                chartType === 'stacked'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stacked View
            </button>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                type="number"
                domain={[0, 60]}
                ticks={[0, 12, 24, 36, 48, 60]}
                tickFormatter={(month) => month === 0 ? 'Now' : `${month / 12}y`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                domain={[0, (dataMax) => Math.ceil(dataMax / 10000) * 10000]}
              />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend
                iconType="rect"
                formatter={(value) =>
                  value === 'minimumOnly' ? 'Minimum Payments Only' :
                  'Snowball Method'
                }
                wrapperStyle={{ paddingBottom: '10px' }}
              />
              <Line type="monotone" dataKey="minimumOnly" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="snowball" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={stackedChartData.data || []} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                type="number"
                domain={[0, 60]}
                ticks={[0, 12, 24, 36, 48, 60]}
                tickFormatter={(month) => month === 0 ? 'Now' : `${month / 12}y`}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                domain={[0, (dataMax) => Math.ceil(dataMax / 10000) * 10000]}
              />
              <Tooltip 
                formatter={(value, name) => [formatCurrency(Math.round(value)), name]}
                labelFormatter={(month) => `Month ${month}`}
              />
              <Legend wrapperStyle={{ paddingBottom: '10px' }} />
              {stackedChartData.debtInfo && stackedChartData.debtInfo.map((debt, index) => (
                <Area
                  key={debt.name}
                  type="monotone"
                  dataKey={debt.name}
                  stackId="1"
                  stroke={debt.color}
                  fill={debt.color}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>

        {/* Scary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          {/* Minimum Payments */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <div className="bg-yellow-100 rounded-full p-2 mr-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-yellow-800">Minimum Payments</h3>
            </div>
            <p className="text-xl font-bold text-yellow-600 mb-1">
              {minimumPayoffMonths > 0 ? minimumPayoffMonths : 'Never'} {minimumPayoffMonths > 0 ? 'months' : ''}
            </p>
            <p className="text-sm text-yellow-700">to pay off</p>
            <p className="text-xs text-yellow-600 mt-2">
              {formatCurrency(minimumInterestPaid)} total interest
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Without payments, debt would grow to {formatCurrency(scenarios.doNothing[12]?.balance)} in 1 year
            </p>
          </div>

          {/* Snowball */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
            <div className="flex items-center mb-3">
              <div className="bg-green-100 rounded-full p-2 mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-800">Snowball Method</h3>
            </div>
            <p className="text-xl font-bold text-green-600 mb-1">
              {snowballPayoffMonths > 0 ? snowballPayoffMonths : 'Never'} {snowballPayoffMonths > 0 ? 'months' : ''}
            </p>
            <p className="text-sm text-green-700">to pay off</p>
            <p className="text-xs text-green-600 mt-2">
              {formatCurrency(snowballInterestPaid)} total interest
            </p>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">The Snowball Advantage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">You'll save</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(Math.max(0, minimumInterestPaid - snowballInterestPaid))}
              </p>
              <p className="text-sm text-gray-600">in interest payments</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">You'll be debt-free</p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.max(0, minimumPayoffMonths - snowballPayoffMonths)}
              </p>
              <p className="text-sm text-gray-600">months sooner</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              <strong>Your extra {formatCurrency(extraPayment)}/month</strong> transforms into <strong>{formatCurrency(Math.max(0, minimumInterestPaid - snowballInterestPaid))}</strong> in savings. 
              {snowballPayoffMonths > 0 && extraPayment > 0 && (
                <>
                  {' '}That's a <strong>{Math.round(Math.max(0, minimumInterestPaid - snowballInterestPaid) / (extraPayment * snowballPayoffMonths) * 100)}% return</strong> on your extra payments!
                </>
              )}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <p className="text-sm text-center text-gray-500 mt-4">
          Built with real debt data using the Snowball method.
        </p>
      </div>
    </div>
  );
};

export default WhatIfMachine;