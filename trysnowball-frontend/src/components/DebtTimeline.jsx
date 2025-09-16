import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { calculateIndividualDebtTimeline, calculateSnowballTimeline, calculateDebtFreeDate } from '../utils/debtTimelineCalculator';

const DebtTimeline = ({ debts, timelineView, extraPayment = 0 }) => {
  const { colors: themeColors } = useTheme();
  
  // Safe fallback for colors prop
  const colors = themeColors || {
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
  
  if (!debts || debts.length === 0) {
    return (
      <div className={`text-center py-8 ${colors.text.muted}`}>
        <p>Add debts to see your payoff timeline</p>
      </div>
    );
  }

  const debtFreeInfo = calculateDebtFreeDate(debts, extraPayment);
  
  const renderIndividualTimelines = () => {
    return (
      <div className="space-y-8">
        {debts.map((debt, index) => {
          const timeline = calculateIndividualDebtTimeline(debt, 0); // No extra payment for individual view
          
          if (timeline.length === 0) {
            return (
              <div key={debt.id} className={`p-4 rounded-lg border ${colors.border}`}>
                <h4 className={`font-semibold ${colors.text.primary} mb-2`}>{debt.name}</h4>
                <p className={`${colors.text.muted}`}>This debt cannot be paid off with current minimum payment</p>
              </div>
            );
          }
          
          const chartData = timeline.map(entry => ({
            month: entry.displayDate,
            balance: entry.balance,
            date: entry.date
          }));
          
          const payoffMonths = timeline.length;
          const payoffDate = new Date();
          payoffDate.setMonth(payoffDate.getMonth() + payoffMonths);
          
          return (
            <div key={debt.id} className={`p-6 rounded-lg border ${colors.border} ${colors.surface}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className={`text-lg font-semibold ${colors.text.primary}`}>{debt.name}</h4>
                  <p className={`${colors.text.secondary}`}>
                    Current Balance: £{(debt.amount || debt.balance || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-sm ${colors.text.muted}`}>Payoff Date</div>
                  <div className="font-semibold text-green-600">
                    {payoffDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                  </div>
                  <div className={`text-xs ${colors.text.muted}`}>
                    {payoffMonths} months
                  </div>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      interval="preserveStartEnd"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`£${value.toLocaleString()}`, 'Balance']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const date = new Date(payload[0].payload.date);
                          return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                        }
                        return label;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#dc2626" 
                      strokeWidth={2}
                      dot={{ fill: '#dc2626', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderCombinedTimeline = () => {
    const timeline = calculateSnowballTimeline(debts, extraPayment);
    
    if (timeline.length === 0) {
      return (
        <div className={`text-center py-8 ${colors.text.muted}`}>
          <p>Unable to calculate combined timeline</p>
        </div>
      );
    }
    
    const chartData = timeline.map(entry => ({
      month: entry.displayDate,
      balance: entry.totalBalance,
      date: entry.date
    }));
    
    return (
      <div className={`p-6 rounded-lg border ${colors.border} ${colors.surface}`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h4 className={`text-xl font-semibold ${colors.text.primary}`}>Combined Debt Payoff Timeline</h4>
            <p className={`${colors.text.secondary}`}>
              Using snowball method with £{extraPayment.toLocaleString()} extra payment
            </p>
          </div>
          {debtFreeInfo && (
            <div className="text-right">
              <div className={`text-sm ${colors.text.muted}`}>Debt Free Date</div>
              <div className="text-xl font-bold text-green-600">
                {new Date(debtFreeInfo.date).toLocaleDateString('en-GB', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </div>
              <div className={`text-sm ${colors.text.muted}`}>
                {debtFreeInfo.months} months to freedom
              </div>
            </div>
          )}
        </div>
        
        <div className="h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                interval="preserveStartEnd"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value) => [`£${value.toLocaleString()}`, 'Total Balance']}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const date = new Date(payload[0].payload.date);
                    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                  }
                  return label;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#059669" 
                strokeWidth={3}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Debt payoff order */}
        <div className="border-t pt-4">
          <h5 className={`font-semibold ${colors.text.primary} mb-3`}>Snowball Payoff Order</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {debts
              .filter(debt => (debt.amount || debt.balance || 0) > 0)
              .sort((a, b) => (a.amount || a.balance) - (b.amount || b.balance))
              .map((debt, index) => (
                <div key={debt.id} className={`p-3 rounded-lg border ${colors.border} bg-gray-50`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className={`font-medium ${colors.text.primary}`}>{debt.name}</div>
                      <div className={`text-xs ${colors.text.muted}`}>
                        £{(debt.amount || debt.balance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {timelineView === 'individual' ? renderIndividualTimelines() : renderCombinedTimeline()}
    </div>
  );
};

export default DebtTimeline;