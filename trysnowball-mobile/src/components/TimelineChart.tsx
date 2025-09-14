import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

interface DataPoint {
  month: string;
  paidOff: number;
  remaining: number;
}

export default function TimelineChart() {
  const { colors } = useTheme();
  
  // Sample data - would come from API
  const data: DataPoint[] = [
    { month: 'Jan', paidOff: 2000, remaining: 18000 },
    { month: 'Feb', paidOff: 3500, remaining: 16500 },
    { month: 'Mar', paidOff: 5200, remaining: 14800 },
    { month: 'Apr', paidOff: 7000, remaining: 13000 },
    { month: 'May', paidOff: 9000, remaining: 11000 },
    { month: 'Jun', paidOff: 11500, remaining: 8500 },
  ];

  const chartWidth = screenWidth - theme.spacing.lg * 2;
  const chartHeight = 250;
  const padding = 40;
  
  const maxValue = 20000;
  const xScale = (chartWidth - padding * 2) / (data.length - 1);
  const yScale = (chartHeight - padding * 2) / maxValue;

  const pathData = data
    .map((point, index) => {
      const x = padding + index * xScale;
      const y = chartHeight - padding - point.paidOff * yScale;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => {
          const y = chartHeight - padding - (maxValue * percent / 100) * yScale;
          return (
            <Line
              key={percent}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke={colors.border}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Progress line */}
        <Path
          d={pathData}
          stroke={colors.success}
          strokeWidth="3"
          fill="none"
        />

        {/* Data points */}
        {data.map((point, index) => {
          const x = padding + index * xScale;
          const y = chartHeight - padding - point.paidOff * yScale;
          return (
            <Circle
              key={index}
              cx={x}
              cy={y}
              r="4"
              fill={colors.success}
            />
          );
        })}

        {/* X-axis labels */}
        {data.map((point, index) => {
          const x = padding + index * xScale;
          return (
            <SvgText
              key={index}
              x={x}
              y={chartHeight - 10}
              fontSize="12"
              fill={colors.text.secondary}
              textAnchor="middle"
            >
              {point.month}
            </SvgText>
          );
        })}

        {/* Milestone markers */}
        {[25, 50, 75].map((percent) => {
          const value = maxValue * percent / 100;
          const dataIndex = data.findIndex(d => d.paidOff >= value);
          if (dataIndex !== -1) {
            const x = padding + dataIndex * xScale;
            const y = chartHeight - padding - value * yScale;
            return (
              <Circle
                key={percent}
                cx={x}
                cy={y}
                r="8"
                fill={colors.warning}
                opacity="0.3"
              />
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.md,
  },
});