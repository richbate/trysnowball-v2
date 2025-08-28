# Chart Components

Organized chart components for debt visualization throughout the TrySnowball app.

## Structure

```
charts/
├── index.js           # Unified exports and utilities
├── TrendChart.jsx     # Small SVG trend lines for debt progress
├── SnowballChart.jsx  # Full snowball comparison with statistics  
├── TimelineChart.jsx  # Timeline projections (line/stacked)
├── ScenarioChart.jsx  # What-if scenario modeling
└── README.md         # This documentation
```

## Components

### `TrendChart`
**Purpose:** Small inline SVG charts showing debt balance trends  
**Used in:** MyPlan debt list items  
**Props:**
- `data` - Array of `{date, balance}` objects
- `width` - Chart width (default: 80px)
- `height` - Chart height (default: 30px)

**Features:**
- Automatic color coding (green=decreasing, red=increasing)
- SVG-based for performance
- Responsive scaling

### `SnowballChart` 
**Purpose:** Comprehensive snowball method visualization with stats  
**Used in:** MyPlan Strategy tab  
**Props:**
- `debts` - Array of debt objects
- `extraPayment` - Additional monthly payment
- `colors` - Theme colors object

**Features:**
- Line chart comparison (minimum vs snowball)
- Payoff timeline calculations
- Interest savings statistics
- Built-in demo data fallback

### `TimelineChart`
**Purpose:** Interactive timeline projections for committed debt plans  
**Used in:** MyPlan "Your Forecast" tab  
**Props:**
- `chartData` - Monthly projection data
- `stackedChartData` - Individual debt breakdown data
- `chartType` - 'line' or 'stacked'
- `height` - Chart height (default: 400px)

**Features:**
- Switchable line/stacked views
- 5-year projection timeline
- Responsive Recharts implementation

### `ScenarioChart`
**Purpose:** Exploratory what-if scenario modeling  
**Used in:** WhatIfMachine page  
**Props:**
- `chartData` - Scenario comparison data
- `stackedChartData` - Individual debt breakdown
- `chartType` - Chart display type
- `height` - Chart height
- `showDoNothing` - Include "do nothing" scenario

**Features:**
- Multiple scenario comparison
- Interactive exploration
- Demo data generation

## Utilities

### `formatCurrency(value)`
Consistent currency formatting across all charts.
Returns: `'£1,234'` format

### `simulateSnowball(debts, totalPayment)`
Core debt snowball calculation engine.
Returns: Number of months to payoff (-1 if >120 months)

## Usage Examples

```jsx
// Simple trend line
import { TrendChart } from '../components/charts';
<TrendChart data={debtHistory} width={100} height={40} />

// Full timeline with controls
import { TimelineChart } from '../components/charts';
<TimelineChart 
  chartData={projections}
  stackedChartData={individualDebts}
  chartType={chartType}
  height={400}
/>
```

## Design Principles

1. **Consistent Styling:** All charts use matching colors and formatting
2. **Reusable Components:** Each chart accepts props for customization
3. **Performance:** SVG for small charts, Recharts for complex visualizations
4. **Accessibility:** Proper labeling and responsive design
5. **Data Safety:** Graceful handling of missing/invalid data

## Dependencies

- `recharts` - For interactive charts (Line, Area, ResponsiveContainer)
- React hooks for state management
- TailwindCSS for styling integration