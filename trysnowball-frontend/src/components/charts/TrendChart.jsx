import React from 'react';

const TrendChart = ({ data, width = 80, height = 30 }) => {
  if (!data || data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ width, height }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Sort data by date to ensure proper trend line
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Calculate min and max values for scaling
  const values = sortedData.map(d => d.balance);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero
  
  // Determine trend direction and color
  const firstValue = sortedData[0].balance;
  const lastValue = sortedData[sortedData.length - 1].balance;
  const isDecreasing = lastValue < firstValue;
  const trendChange = Math.abs(lastValue - firstValue);
  
  // Color based on trend and magnitude
  let lineColor, fillColor;
  if (isDecreasing) {
    // Green for decreasing debt (good)
    if (trendChange > 1000) {
      lineColor = '#16a34a'; // Strong green
      fillColor = '#dcfce7'; // Light green
    } else {
      lineColor = '#22c55e'; // Medium green  
      fillColor = '#ecfdf5'; // Very light green
    }
  } else {
    // Red/orange for increasing debt (concerning)
    if (trendChange > 500) {
      lineColor = '#dc2626'; // Strong red
      fillColor = '#fef2f2'; // Light red
    } else {
      lineColor = '#f97316'; // Orange
      fillColor = '#fff7ed'; // Light orange
    }
  }
  
  // Create SVG path points
  const points = sortedData.map((item, index) => {
    const x = (index / (sortedData.length - 1)) * (width - 8) + 4; // 4px padding
    const y = height - 4 - ((item.balance - minValue) / valueRange) * (height - 8); // Invert Y and add padding
    return `${x},${y}`;
  }).join(' ');
  
  // Create area fill path (from line to bottom)
  const areaPoints = sortedData.map((item, index) => {
    const x = (index / (sortedData.length - 1)) * (width - 8) + 4;
    const y = height - 4 - ((item.balance - minValue) / valueRange) * (height - 8);
    return [x, y];
  });
  
  const areaPath = `M${areaPoints[0][0]},${height-2} L${areaPoints.map(p => `${p[0]},${p[1]}`).join(' L')} L${areaPoints[areaPoints.length-1][0]},${height-2} Z`;

  return (
    <div className="relative">
      <svg width={width} height={height} className="overflow-visible">
        {/* Area fill */}
        <path
          d={areaPath}
          fill={fillColor}
          opacity="0.3"
        />
        
        {/* Trend line */}
        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {sortedData.map((item, index) => {
          const x = (index / (sortedData.length - 1)) * (width - 8) + 4;
          const y = height - 4 - ((item.balance - minValue) / valueRange) * (height - 8);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={lineColor}
              className="opacity-80"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default TrendChart;