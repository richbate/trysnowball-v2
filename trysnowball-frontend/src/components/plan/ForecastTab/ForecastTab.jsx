import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import NoDebtsState from '../../../components/NoDebtsState';
import Button from '../../../components/ui/Button';
import { TimelineChart } from '../../../components/charts';
import { useCsvExport } from '../../../hooks/useCsvExport';
import { formatCurrency } from '../../../utils/debtFormatting';
import { calculateSnowballTimeline, calculateAvalancheTimeline } from '../../../utils/debtTimelineCalculator';
import MathDetails from '../../../components/MathDetails';
import SnowballBoostMeter from '../../../components/SnowballBoostMeter';
import ImpactHeadline from '../../../components/ImpactHeadline';
import { flags } from '../../../utils/flags';
import ScenariosPanel from '../../../components/ScenariosPanel.jsx';
import { computeImpacts } from '../../../lib/simulator/impact.js';
import DebtPaymentMatrix from '../../../components/DebtPaymentMatrix';
import FocusSelect from '../../FocusSelect.jsx';
import { getFocusedDebtIdFromSearch, buildDebtBalanceSeries, buildFocusSearchString, getDebtLabelById, getFocusedDebtPayoffDate } from '../../../lib/selectors';

// Normalize chart inputs - bulletproof data sanitization
function toNumber(n) {
  const v = typeof n === "string" ? Number(n.replace(/[£, ]/g, "")) : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function normalizeSeries(rows) {
  return Array.isArray(rows)
    ? rows
        .map((r, i) => ({
          month: r?.month ?? `Month ${i + 1}`,
          minimumOnly: toNumber(r?.minimumOnly),
          snowball: toNumber(r?.snowball),
        }))
        .filter(r => Number.isFinite(r.minimumOnly) && Number.isFinite(r.snowball))
    : [];
}

const TimelineTab = ({ colors, timelineDebtsData, demoDataCleared, hasNoDebtData, dataManagerDebts, planTotalsDebts, planLoading, payoffStrategy = 'snowball', onTabChange }) => {
  console.log('[TimelineTab] Props received:', {
    hasNoDebtData,
    planTotalsDebts: planTotalsDebts?.length || 0,
    timelineDebtsData: timelineDebtsData?.length || 0,
    planLoading
  });
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [extraPayment, setExtraPayment] = useState(100);
  const [chartType, setChartType] = useState('line'); // 'line' or 'stacked'
  const [scenarioSelections, setScenarioSelections] = useState([]);
  const [forceShowScenarios, setForceShowScenarios] = useState(false);
  const [scenariosExpanded, setScenariosExpanded] = useState(false);
  
  // Focus functionality
  const focusedDebtId = getFocusedDebtIdFromSearch(searchParams.toString());
  
  const handleFocusChange = (debtId) => {
    const newSearch = buildFocusSearchString(searchParams.toString(), debtId);
    setSearchParams(newSearch);
    
    // Track focus change analytics
    if (window.posthog) {
      const debtName = debtId ? timelineDebts.find(d => d.id === debtId)?.name || debtId : null;
      window.posthog.capture('plan_forecast_focus_change', {
        debt_id: debtId,
        debt_name: debtName
      });
    }
  };
  
  const { exportTimelineData } = useCsvExport();

  // Transform debt data for DebtEngine with order preservation - use same source as other tabs
  const timelineDebts = useMemo(() => {
    const sourceDebts = dataManagerDebts || [];
    if (!Array.isArray(sourceDebts)) return [];
    return sourceDebts.map(debt => ({
      id: debt.id || debt.name,
      name: debt.name,
      balance: debt.balance || debt.amount || 0,
      rate: debt.interest || debt.rate || 20, // Use actual interest rate or default to 20%
      minPayment: debt.min || debt.minPayment || debt.regularPayment || Math.max(25, Math.floor((debt.balance || debt.amount || 0) * 0.02)),
      order: debt.order // Critical: preserve user-defined order
    }));
  }, [dataManagerDebts]);

  // Check for scenario parameter on mount
  useEffect(() => {
    if (searchParams.get('scenario') === 'true') {
      setForceShowScenarios(true);
      setScenariosExpanded(true); // Auto-expand for testing
    }
  }, [searchParams]);

  // Analytics tracking for slider changes (throttled)
  useEffect(() => {
    const id = setTimeout(() => {
      // Only track if extraPayment is meaningful (> 0)
      if (extraPayment > 0 && window.posthog) {
        window.posthog.capture('plan_boost_change', {
          tab: 'forecast',
          boost_pennies: extraPayment * 100,
          debts_count: timelineDebts.length
        });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [extraPayment, timelineDebts.length]);

  const onScenariosChange = (s) => setScenarioSelections(s);

  const totalMinPaymentsTimeline = (timelineDebts || []).reduce((sum, debt) => sum + debt.minPayment, 0);
  const totalDebtTimeline = (timelineDebts || []).reduce((sum, debt) => sum + debt.balance, 0);

  // Calculate impacts using the new impact system
  const monthsCap = 120;
  const impacts = useMemo(() => {
    if (timelineDebts.length === 0) {
      return { 
        base: null, 
        combined: null, 
        perScenario: [], 
        agg: { monthsSaved: 0, interestSaved: 0 },
        plans: { basePlan: null, combinedPlan: null }
      };
    }
    return computeImpacts(timelineDebts, extraPayment, scenarioSelections, monthsCap);
  }, [timelineDebts, extraPayment, scenarioSelections]);

  // Get extra monthly amount from combined plan
  const planExtraMonthly = useMemo(() => {
    if (!impacts.plans.combinedPlan) return extraPayment;
    return impacts.plans.combinedPlan.extraMonthly;
  }, [impacts, extraPayment]);

  // Helper function to choose the right calculation method based on strategy
  const calculateTimeline = useMemo(() => {
    return payoffStrategy === 'avalanche' ? calculateAvalancheTimeline : calculateSnowballTimeline;
  }, [payoffStrategy]);

  // Create timeline-based chart data with real dates
  const strategyTimeline = useMemo(() => {
    if (timelineDebts.length === 0) return [];
    
    // Use combined extra payment from impact calculations
    return calculateTimeline(timelineDebts, planExtraMonthly);
  }, [timelineDebts, planExtraMonthly, calculateTimeline]);
  
  const minimumTimeline = useMemo(() => {
    if (timelineDebts.length === 0) return [];
    return calculateTimeline(timelineDebts, 0); // No extra payment for minimum
  }, [timelineDebts, calculateTimeline]);

  // Focus-related calculations (must come after timelineDebts and strategyTimeline are defined)
  const focusedDebtLabel = getDebtLabelById(timelineDebts, focusedDebtId);
  const focusedDebtSeries = buildDebtBalanceSeries(strategyTimeline, focusedDebtId);
  const focusedDebtPayoffDate = getFocusedDebtPayoffDate(strategyTimeline, focusedDebtId);

  // Transform timeline data for payment matrix
  const matrixTimeline = useMemo(() => {
    if (!strategyTimeline || strategyTimeline.length === 0) return [];
    
    return strategyTimeline.map((entry, index) => ({
      monthIndex: index,
      date: entry.date,
      dateLabel: entry.displayDate,
      totalSnowball: entry.totalBalance || 0,
      extraPayment: planExtraMonthly,
      flex: 0, // Could be used for additional flexible payments
      items: (entry.debts || [])
        .filter(debt => {
          // Only include debts that are in the current timeline debts list
          const timelineDebt = (timelineDebts || []).find(td => td.name === debt.name);
          return timelineDebt && debt.balance > 0;
        })
        .map(debt => {
          // Find the corresponding timeline debt to get payment info
          const timelineDebt = (timelineDebts || []).find(td => td.name === debt.name);
          return {
            debtId: debt.name,
            label: debt.name,
            payment: timelineDebt?.minPayment || 0, // Use the actual minimum payment
            interest: 0, // Could calculate based on remaining balance
            principal: timelineDebt?.minPayment || 0,
            extra: 0,
            remaining: debt.balance || 0,
          };
        })
    }));
  }, [strategyTimeline, planExtraMonthly, timelineDebts]);

  // Stable debt column order for payment matrix - use actual user debt labels
  const debtOrder = useMemo(() => {
    return (timelineDebts || []).map(d => d.name).filter(Boolean);
  }, [timelineDebts]);

  // Custom month label function for payment matrix
  const monthLabel = (m) => {
    // prefer existing label if present
    if (m?.dateLabel) return m.dateLabel;
    // else build from current date + monthIndex
    if (Number.isFinite(m?.monthIndex)) {
      const d = new Date();
      d.setMonth(d.getMonth() + m.monthIndex);
      return d.toLocaleString('en-GB', { month: 'short', year: '2-digit' }).replace(' ', '-');
    }
    return `M${(m?.monthIndex ?? 0) + 1}`;
  };
  
  const chartData = useMemo(() => {
    const maxLength = Math.max(strategyTimeline.length, minimumTimeline.length);
    const data = [];
    
    for (let i = 0; i < maxLength; i++) {
      const strategyEntry = strategyTimeline[i];
      const minimumEntry = minimumTimeline[i];
      
      data.push({
        month: strategyEntry?.displayDate || minimumEntry?.displayDate || `Month ${i + 1}`,
        minimumOnly: minimumEntry?.totalBalance || 0,
        snowball: strategyEntry?.totalBalance || 0, // Keep 'snowball' key for chart compatibility
      });
    }
    
    console.log('[TimelineTab] Chart data:', {
      dataLength: data.length,
      planExtraMonthly,
      firstPoint: data[0],
      lastPoint: data[data.length - 1]
    });
    return data;
  }, [strategyTimeline, minimumTimeline, planExtraMonthly]);

  // Create stacked chart data showing individual debt balances over time
  const stackedChartData = useMemo(() => {
    if (chartType !== 'stacked') return [];
    
    const sortedDebts = [...timelineDebts].sort((a, b) => a.balance - b.balance);
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
          let totalPayment = totalMinPaymentsTimeline + extraPayment;
          
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
  }, [timelineDebts, extraPayment, totalMinPaymentsTimeline, chartType]);

  // Ensure both datasets exist for the selected view
  const lineData = useMemo(() => {
    return normalizeSeries(chartData);
  }, [chartData]);

  const stackedData = useMemo(() => {
    // stackedChartData is either [] (when not stacked) or { data: [...], debtInfo: [...] } (when stacked)
    const d = Array.isArray(stackedChartData) ? [] : (stackedChartData?.data ?? []);
    console.log('[TimelineTab] Stacked raw data:', d?.length, 'entries, sample:', d[0]);
    // coerce every key to a number except 'month'
    const normalized = Array.isArray(d)
      ? d.map(row =>
          Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, k === "month" ? row.month : toNumber(v)])
          )
        )
      : [];
    console.log('[TimelineTab] Stacked normalized:', normalized?.length, 'entries, sample:', normalized[0]);
    return normalized;
  }, [stackedChartData]);

  const hasLine = lineData.length > 0 && lineData.some(r => r.minimumOnly > 0 || r.snowball > 0);
  const hasStacked = stackedData.length > 0 && Object.keys(stackedData[0] || {}).length > 1;
  
  console.log('[TimelineTab] Chart state:', {
    chartType,
    hasLine,
    hasStacked,
    stackedDataLength: stackedData.length,
    debtInfoLength: stackedChartData?.debtInfo?.length || 0
  });

  // Calculate payoff months from line data
  const strategyPayoffMonths = lineData.findIndex((p, index) => index > 0 && p.snowball <= 1);
  const minimumPayoffMonths = lineData.findIndex((p, index) => index > 0 && p.minimumOnly <= 1);
  
  // Calculate interest paid (simplified calculation)
  const strategyInterestPaid = strategyPayoffMonths > 0 ? strategyPayoffMonths * 100 : 0;
  const minimumInterestPaid = minimumPayoffMonths > 0 ? minimumPayoffMonths * 150 : 0;

  // Calculate deltas for scenario display
  const monthsSaved = Math.max(0, minimumPayoffMonths - strategyPayoffMonths);
  const interestSaved = Math.max(0, minimumInterestPaid - strategyInterestPaid);
  
  // Check if user has any active scenarios
  const hasActiveScenarios = scenarioSelections.some(s => s.active);
  
  // Temporarily show headline even without scenarios if there's improvement from slider
  const hasSliderImpact = extraPayment > 0 && (monthsSaved > 0 || interestSaved > 0);
  const showImpactHeadline = (hasActiveScenarios && (impacts.agg.monthsSaved > 0 || impacts.agg.interestSaved > 0)) || 
                            (!hasActiveScenarios && hasSliderImpact);
  
  console.log('[TimelineTab] Impact headline debug:', {
    hasActiveScenarios,
    hasSliderImpact,
    monthsSaved: impacts.agg.monthsSaved,
    interestSaved: impacts.agg.interestSaved,
    sliderMonthsSaved: monthsSaved,
    sliderInterestSaved: interestSaved,
    extraPayment,
    showImpactHeadline
  });

  if (hasNoDebtData) {
    return (
      <NoDebtsState 
        title="No Forecast Yet"
        subtitle="Add your debts to see your personalised debt-free date and repayment timeline."
        icon="📅"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Your Path to Debt Freedom</h2>
          <p className={`text-sm ${colors.text.muted} mt-1`}>Based on your debts and payments today</p>
        </div>
      </div>

      {/* Snowball Slider & Impact - 50/50 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <SnowballBoostMeter
          value={extraPayment}
          onChange={setExtraPayment}
          min={0}
          max={1100}
          step={25}
        />
        <ImpactHeadline 
          impact={{
            monthsSaved: hasActiveScenarios ? impacts.agg.monthsSaved : monthsSaved,
            interestSaved: hasActiveScenarios ? impacts.agg.interestSaved : interestSaved
          }}
          basePayoffMonths={minimumPayoffMonths}
          strategyPayoffMonths={strategyPayoffMonths}
        />
      </div>

      {/* Centered Snowflake CTA underneath both boxes */}
      <div className="flex flex-col items-center space-y-2">
        <button
          onClick={() => onTabChange && onTabChange('snowflakes')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <span>Log a Snowflake</span>
          <span>❄️</span>
        </button>
        <p className="text-xs text-gray-500 text-center">
          💡 One-off payments give your plan an instant boost.
        </p>
      </div>

      {/* Core Numbers - Subdued */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalDebtTimeline)}</div>
          <div className="text-sm text-slate-600">Total Balance</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalMinPaymentsTimeline)}</div>
          <div className="text-sm text-slate-600">Monthly Minimums</div>
        </div>
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="text-2xl font-bold text-slate-800">{formatCurrency(totalMinPaymentsTimeline + planExtraMonthly)}</div>
          <div className="text-sm text-slate-600">Your Payment Each Month</div>
        </div>
      </div>


      {/* Expandable Scenarios Panel */}
      {(flags.SCENARIOS || forceShowScenarios) && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <button
            onClick={() => {
              const newExpanded = !scenariosExpanded;
              setScenariosExpanded(newExpanded);
              if (window.posthog) {
                window.posthog.capture('plan_scenarios_toggle', {
                  open: newExpanded
                });
              }
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <span className="font-medium text-slate-700">Explore lifestyle boosts</span>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveScenarios && !scenariosExpanded && (
                <span className="text-sm text-emerald-600 font-medium">
                  {scenarioSelections.filter(s => s.active).length} active scenarios
                </span>
              )}
              <svg 
                className={`w-5 h-5 text-slate-500 transition-transform ${scenariosExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {scenariosExpanded && (
            <div className="px-4 pb-4">
              <ScenariosPanel onChange={onScenariosChange} impacts={impacts.perScenario} />
            </div>
          )}
        </div>
      )}

      {/* Chart Section - More Breathing Room */}
      <div className="space-y-6 py-4">
        {/* Focus Control */}
        {timelineDebts.length > 0 && (
          <FocusSelect 
            debts={timelineDebts} 
            focusedDebtId={focusedDebtId} 
            onChange={handleFocusChange}
          />
        )}
        
        {/* Focused Debt Badge */}
        {focusedDebtId && focusedDebtLabel && (
          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${colors.surfaceSecondary} border ${colors.border}`}>
            <span className={`text-sm font-medium ${colors.text.primary}`}>
              Focused on: {focusedDebtLabel}
            </span>
            {focusedDebtPayoffDate && (
              <span className={`text-sm ${colors.text.muted}`}>
                Payoff by {focusedDebtPayoffDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </span>
            )}
            <button
              onClick={() => handleFocusChange(null)}
              className={`text-sm px-2 py-1 rounded ${colors.text.muted} hover:${colors.text.secondary}`}
            >
              ×
            </button>
          </div>
        )}

        {/* Chart Controls */}
        <div className="flex justify-between items-center">
          {/* Chart Type Toggle */}
          <div className="bg-gray-100 p-1 rounded-lg">
            <Button
              onClick={() => {
                const prevView = chartType;
                setChartType('line');
                if (window.posthog) {
                  window.posthog.capture('plan_chart_view_change', {
                    tab: 'forecast',
                    from: prevView,
                    to: 'line',
                    debts_count: timelineDebts.length,
                    boost_pennies: extraPayment * 100
                  });
                }
              }}
              variant={chartType === 'line' ? 'muted' : 'ghost'}
              size="sm"
              className={chartType === 'line' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
            >
              Line View
            </Button>
            <Button
              onClick={() => {
                const prevView = chartType;
                setChartType('stacked');
                if (window.posthog) {
                  window.posthog.capture('plan_chart_view_change', {
                    tab: 'forecast',
                    from: prevView,
                    to: 'stacked',
                    debts_count: timelineDebts.length,
                    boost_pennies: extraPayment * 100
                  });
                }
              }}
              variant={chartType === 'stacked' ? 'muted' : 'ghost'}
              size="sm"
              className={chartType === 'stacked' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}
            >
              Stacked View
            </Button>
          </div>
          
          {/* Export Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                exportTimelineData(strategyTimeline);
                if (window.posthog) {
                  window.posthog.capture('plan_export_csv', {
                    tab: 'forecast',
                    dataset: 'timeline',
                    rows: strategyTimeline.length,
                    debts_count: timelineDebts.length,
                    boost_pennies: extraPayment * 100
                  });
                }
              }}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              📊 Export as CSV
            </Button>
          </div>
        </div>

        {/* Chart - Guarded Rendering with Increased Height */}
        {!hasLine && chartType === "line" && (
          <div className="p-8 text-center text-sm text-slate-600 border rounded bg-gray-50">
            📊 Add debts or load demo data to see your forecast.
          </div>
        )}
        {chartType === "line" && hasLine && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <TimelineChart 
              chartData={lineData}
              stackedChartData={null}
              chartType="line"
              height={500}
              focusedDebtSeries={focusedDebtId ? focusedDebtSeries : null}
              focusedDebtLabel={focusedDebtLabel}
            />
          </div>
        )}

        {chartType === "stacked" && !hasStacked && (
          <div className="p-8 text-center text-sm text-slate-600 border rounded bg-gray-50">
            📊 Not enough data for stacked view yet — switch to Line view.
          </div>
        )}
        {chartType === "stacked" && hasStacked && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <TimelineChart 
              chartData={null}
              stackedChartData={{ 
                data: stackedData,
                debtInfo: stackedChartData?.debtInfo || []
              }}
              chartType="stacked"
              height={500}
            />
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Minimum Payments */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <div className="bg-yellow-100 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-yellow-800">Minimum Payments Only</h3>
          </div>
          <p className="text-xl font-bold text-yellow-600 mb-1">
            {minimumPayoffMonths > 0 ? minimumPayoffMonths : 'Never'} {minimumPayoffMonths > 0 ? 'months' : ''}
          </p>
          <p className="text-sm text-yellow-700">to be debt-free</p>
          <p className="text-xs text-yellow-600 mt-2">
            {formatCurrency(minimumInterestPaid)} interest paid
          </p>
        </div>

        {/* Strategy Method */}
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <div className="bg-green-100 rounded-full p-2 mr-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-green-800">{payoffStrategy === 'avalanche' ? 'Avalanche' : 'Snowball'} Strategy</h3>
          </div>
          <p className="text-xl font-bold text-green-600 mb-1">
            {strategyPayoffMonths > 0 ? strategyPayoffMonths : 'Never'} {strategyPayoffMonths > 0 ? 'months' : ''}
          </p>
          <p className="text-sm text-green-700">to be debt-free</p>
          <p className="text-xs text-green-600 mt-2">
            {formatCurrency(strategyInterestPaid)} interest paid
          </p>
        </div>
      </div>

      {/* Impact Summary */}
      {strategyPayoffMonths > 0 && minimumPayoffMonths > 0 && (
        <div className={`rounded-lg shadow-lg p-6 ${colors.surface}`}>
          <h3 className={`text-xl font-bold ${colors.text.primary} mb-4`}>Why It Matters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Save</p>
              <p className="text-3xl font-bold text-green-600">
                £{Math.max(0, minimumInterestPaid - strategyInterestPaid).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">in interest</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Be debt-free</p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.max(0, minimumPayoffMonths - strategyPayoffMonths)}
              </p>
              <p className="text-sm text-gray-600">months sooner</p>
            </div>
          </div>
        </div>
      )}

      {/* Math Details - Trust-building payoff table */}
      <MathDetails extraPayment={extraPayment} />

      {/* Payment Matrix - Detailed month-by-month schedule */}
      <DebtPaymentMatrix
        timeline={matrixTimeline}
        debtOrder={debtOrder}
        monthLabel={monthLabel}
        defaultOpen={false}
        focusedDebtId={focusedDebtId}
      />
    </div>
  );
};

export default TimelineTab;