import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/debtFormatting';

const DebtProgressionChart = ({ data, height = 400 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No debt progression data available</p>
      </div>
    );
  }

  // Transform data for stacked area chart
  const chartData = [];
  const maxMonths = Math.max(...data.map(debt => debt.progression.length));
  
  for (let month = 1; month <= maxMonths; month++) {
    const monthData = { month };
    data.forEach(debt => {
      const monthProgress = debt.progression.find(p => p.month === month);
      monthData[debt.debtName] = monthProgress ? monthProgress.balance : 0;
    });
    chartData.push(monthData);
  }

  // Generate colors for each debt
  const colors = [
    '#ef4444', // red
    '#f97316', // orange  
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      const activeDebts = payload.filter(entry => entry.value > 0);
      
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold">{`Month ${label}`}</p>
          <p className="text-sm text-gray-600 mb-2">{`Total Remaining: £${total.toFixed(2)}`}</p>
          {activeDebts.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: £${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {data.map((debt, index) => (
            <Area
              key={debt.debtName}
              type="monotone"
              dataKey={debt.debtName}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.7}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DebtProgressionChart;