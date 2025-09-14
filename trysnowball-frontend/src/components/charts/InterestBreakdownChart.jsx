import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BUCKET_COLORS = {
  'cash_advance': '#dc2626',  // Red - highest cost
  'balance_transfer': '#f59e0b', // Amber - medium cost  
  'purchase': '#3b82f6',      // Blue - standard rate
  'other': '#6b7280'          // Gray - fallback
};

const APR_COLORS = {
  'high_20_plus': '#dc2626',   // Red for 20%+
  'medium_10_20': '#f59e0b',   // Amber for 10-20%
  'low_0_10': '#10b981'        // Green for 0-10%
};

const InterestBreakdownChart = ({ 
  interestBreakdown, 
  totalInterestPaid, 
  displayMode = 'pie',  // 'pie' or 'bar'
  height = 300 
}) => {
  if (!interestBreakdown || Object.keys(interestBreakdown).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No interest breakdown available</p>
      </div>
    );
  }

  // Convert interest breakdown to chart data
  const chartData = Object.values(interestBreakdown)
    .filter(bucket => bucket.totalInterest > 0)
    .map(bucket => {
      const percentage = totalInterestPaid > 0 
        ? (bucket.totalInterest / totalInterestPaid) * 100 
        : 0;
      
      // Classify bucket type for coloring
      const bucketType = bucket.bucketName.toLowerCase().includes('cash') ? 'cash_advance' :
                        bucket.bucketName.toLowerCase().includes('transfer') ? 'balance_transfer' :
                        bucket.bucketName.toLowerCase().includes('purchase') ? 'purchase' : 'other';
      
      // Classify APR range for alternative coloring
      const aprRange = bucket.apr >= 20 ? 'high_20_plus' :
                      bucket.apr >= 10 ? 'medium_10_20' : 'low_0_10';
      
      return {
        bucketName: bucket.bucketName,
        totalInterest: bucket.totalInterest,
        totalPrincipal: bucket.totalPrincipal,
        apr: bucket.apr,
        percentage: Math.round(percentage * 10) / 10, // Round to 1dp
        bucketType,
        aprRange,
        color: BUCKET_COLORS[bucketType]
      };
    })
    .sort((a, b) => b.totalInterest - a.totalInterest); // Sort by interest descending

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800">{data.bucketName}</p>
          <p className="text-sm text-gray-600 mb-2">{`APR: ${data.apr}%`}</p>
          <p className="text-red-600">{`Interest: £${data.totalInterest.toFixed(2)}`}</p>
          <p className="text-blue-600">{`Principal: £${data.totalPrincipal.toFixed(2)}`}</p>
          <p className="text-gray-700 font-medium">{`${data.percentage}% of total interest`}</p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg max-w-xs">
          <p className="font-semibold text-gray-800">{data.bucketName}</p>
          <p className="text-sm text-gray-600 mb-2">{`APR: ${data.apr}%`}</p>
          <p className="text-red-600">{`Interest: £${data.totalInterest.toFixed(2)}`}</p>
          <p className="text-gray-700 font-medium">{`${data.percentage}% of total`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 5) return null; // Hide labels for small slices
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {`${Math.round(percentage)}%`}
      </text>
    );
  };

  if (displayMode === 'pie') {
    return (
      <div className="w-full">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Interest by Bucket Type</h3>
          <p className="text-sm text-gray-600">Total interest paid: £{totalInterestPaid.toFixed(2)}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={Math.min(height * 0.35, 120)}
              fill="#8884d8"
              dataKey="totalInterest"
              stroke="#ffffff"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {entry.payload.bucketName} ({entry.payload.apr}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Summary table */}
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bucket
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  APR
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.map((bucket, index) => (
                <tr key={bucket.bucketName} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: bucket.color }}
                      />
                      {bucket.bucketName}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {bucket.apr}%
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    £{bucket.totalInterest.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {bucket.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Bar chart mode
  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Interest Breakdown by Bucket</h3>
        <p className="text-sm text-gray-600">Total interest paid: £{totalInterestPaid.toFixed(2)}</p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="bucketName" 
            stroke="#6b7280"
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `£${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="totalInterest" 
            fill="#ef4444" 
            name="Total Interest"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default InterestBreakdownChart;