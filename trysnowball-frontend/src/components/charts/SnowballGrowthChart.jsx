import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const SnowballGrowthChart = ({ data, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No snowball data available</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const snowballPower = payload.find(p => p.dataKey === 'snowballPower')?.value || 0;
      const clearedPayments = payload.find(p => p.dataKey === 'clearedPayments')?.value || 0;
      const userExtra = payload.find(p => p.dataKey === 'userExtra')?.value || 0;
      
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-semibold">{`Month ${label}`}</p>
          <div className="mt-2 space-y-1">
            <p className="text-purple-700 font-bold text-lg">💥 Snowball Power: £{snowballPower.toFixed(2)}</p>
            <div className="text-sm text-gray-600 pl-4 space-y-1">
              <p className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Your Extra Payment: £{userExtra.toFixed(2)}
              </p>
              <p className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Released Min Payments: £{clearedPayments.toFixed(2)}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              This full £{snowballPower.toFixed(2)} targets your smallest debt
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700">
          <strong>💥 Snowball Power:</strong> The total extra amount applied to your smallest debt each month. 
          Grows as debts are cleared and their minimum payments are released.
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
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
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="snowballPower"
            stroke="#7c3aed"
            fill="#7c3aed"
            fillOpacity={0.3}
            strokeWidth={3}
            name="💥 Snowball Power (Applied to Target Debt)"
          />
          <Line
            type="monotone"
            dataKey="snowballPower"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={{ fill: '#7c3aed', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: '#7c3aed', strokeWidth: 2, fill: '#fff' }}
            name="Snowball Power"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-500">
          💡 Hover over any point to see how your snowball power builds over time
        </p>
      </div>
    </div>
  );
};

export default SnowballGrowthChart;