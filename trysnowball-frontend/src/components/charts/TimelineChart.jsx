import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

// Format currency helper
const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '£0';
  return '£' + Math.round(value).toLocaleString();
};

const TimelineChart = ({ 
  chartData, 
  stackedChartData, 
  chartType = 'line',
  height = 400 
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {chartType === 'line' ? (
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={'preserveStartEnd'}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            domain={[0, (dataMax) => Math.ceil(dataMax / 10000) * 10000]}
          />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend
            iconType="rect"
            formatter={(value) =>
              value === 'minimumOnly' ? 'Minimum Payments Only' : 'Snowball Method'
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
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={'preserveStartEnd'}
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
  );
};

export default TimelineChart;