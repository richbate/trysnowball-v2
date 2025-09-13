import React, { useState, useEffect } from 'react';
import { UKDebt } from '../types/UKDebt';
import { useCreateDebt, useDeleteDebt } from '../hooks/useDebts';
import { simulateCompositeSnowballPlan, generateCompositeforecastSummary, ForecastResultV2 } from '../utils/compositeSimulatorV2';

// Types for debug profiles
interface DebugDebt {
  name: string;
  amount: number;
  apr: number;
  min_payment: number;
  debt_type: 'credit_card' | 'mortgage' | 'auto_loan' | 'student_loan' | 'business_loan' | 'personal_loan';
  buckets?: Array<{
    id: string;
    name: string;
    balance: number;
    apr: number;
    payment_priority: number;
  }>;
}

interface DebugProfile {
  name: string;
  description: string;
  debts: DebugDebt[];
  settings: {
    strategy?: string;
    extra_payment?: number;
    tier?: string;
    achievements?: string[];
    goals?: any[];
  };
}

// Test profiles with different scenarios
const DEBUG_PROFILES: Record<string, DebugProfile> = {
  'clean': {
    name: '🧹 Clean Slate',
    description: 'Empty profile to start fresh',
    debts: [],
    settings: {}
  },
  'single-simple': {
    name: '💳 Single Credit Card',
    description: 'One simple credit card debt',
    debts: [{
      name: 'Barclaycard',
      amount: 3500,
      apr: 23.99,
      min_payment: 105,
      debt_type: 'credit_card' as const
    }],
    settings: { strategy: 'snowball', extra_payment: 200 }
  },
  'multi-debt-family': {
    name: '🎯 Typical UK Household',
    description: 'Common UK consumer debts',
    debts: [
      {
        name: 'Halifax Credit Card',
        amount: 4200,
        apr: 21.9,
        min_payment: 126,
        debt_type: 'credit_card' as const
      },
      {
        name: 'Tesco Clubcard',
        amount: 850,
        apr: 19.9,
        min_payment: 25,
        debt_type: 'credit_card' as const
      },
      {
        name: 'Argos Card',
        amount: 1400,
        apr: 29.9,
        min_payment: 42,
        debt_type: 'credit_card' as const
      },
      {
        name: 'Zopa Personal Loan',
        amount: 5000,
        apr: 12.9,
        min_payment: 167,
        debt_type: 'personal_loan' as const
      }
    ],
    settings: { strategy: 'snowball', extra_payment: 300 }
  },
  'debt-freedom-close': {
    name: '🎉 Almost Debt Free',
    description: 'Someone close to paying off their last debt',
    debts: [
      {
        name: 'HSBC Credit Card',
        amount: 427.43,
        apr: 19.99,
        min_payment: 35,
        debt_type: 'credit_card' as const
      }
    ],
    settings: { 
      strategy: 'avalanche', 
      extra_payment: 300
    }
  },
  'high-earner': {
    name: '💼 UK Business Owner',
    description: 'Small business owner with mixed consumer and business debt',
    debts: [
      {
        name: 'Amex Gold',
        amount: 8400,
        apr: 22.9,
        min_payment: 252,
        debt_type: 'credit_card' as const
      },
      {
        name: 'Lloyds Business Overdraft',
        amount: 12000,
        apr: 15.9,
        min_payment: 200,
        debt_type: 'business_loan' as const
      },
      {
        name: 'NatWest Credit Card',
        amount: 3200,
        apr: 18.9,
        min_payment: 96,
        debt_type: 'credit_card' as const
      },
      {
        name: 'Funding Circle Loan',
        amount: 25000,
        apr: 9.9,
        min_payment: 625,
        debt_type: 'business_loan' as const
      }
    ],
    settings: { 
      strategy: 'avalanche', 
      extra_payment: 800
    }
  },
  'cc-mix': {
    name: '🎯 Multi-APR CP-4 Demo',
    description: 'Single credit card with multiple APR buckets',
    debts: [
      {
        name: 'Santander All in One Card',
        amount: 3000,
        apr: 22.9, // Overall average APR
        min_payment: 100,
        debt_type: 'credit_card' as const,
        buckets: [
          {
            id: 'cash-advances',
            name: 'Cash Advances',
            balance: 500,
            apr: 27.9,
            payment_priority: 1 // Highest priority (paid first)
          },
          {
            id: 'purchases',
            name: 'Purchases',
            balance: 1000,
            apr: 22.9,
            payment_priority: 2 // Medium priority
          },
          {
            id: 'balance-transfer',
            name: 'Balance Transfer',
            balance: 1500,
            apr: 0.0,
            payment_priority: 3 // Lowest priority (0% promo rate)
          }
        ]
      }
    ],
    settings: { 
      strategy: 'avalanche', 
      extra_payment: 100
    }
  }
};

interface DebugShowcaseProps {
  debts: UKDebt[];
}

const DebugShowcase: React.FC<DebugShowcaseProps> = ({ debts }) => {
  const [currentProfile, setCurrentProfile] = useState('clean');
  const [debugData, setDebugData] = useState({});
  const [cpCalculations, setCpCalculations] = useState<any>(null);
  const [cp4Forecast, setCp4Forecast] = useState<ForecastResultV2 | null>(null);
  const [cp4Summary, setCp4Summary] = useState<any>(null);
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [snowballAmount, setSnowballAmount] = useState<number>(200);
  
  const createMutation = useCreateDebt();
  const deleteMutation = useDeleteDebt();

  // Load profile data
  const loadProfile = async (profileKey: string) => {
    const profile = DEBUG_PROFILES[profileKey as keyof typeof DEBUG_PROFILES];
    
    try {
      // Clear existing data by deleting all debts
      console.log('🗑️ Clearing existing debts...');
      for (const debt of debts) {
        await deleteMutation.mutateAsync(debt.id);
      }
      
      // Wait a bit for deletions to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load new profile debts
      console.log('📥 Loading profile:', profile.name);
      for (const debtData of profile.debts) {
        // Convert DebugDebt to CreateUKDebt format
        const ukDebtData = {
          name: debtData.name,
          amount: debtData.amount,
          apr: debtData.apr,
          min_payment: debtData.min_payment,
          debt_type: debtData.debt_type,
          order_index: 1,
          buckets: debtData.buckets
        };
        await createMutation.mutateAsync(ukDebtData);
      }
      
      setCurrentProfile(profileKey);
      console.log('✅ Profile loaded:', profile.name);
      
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      alert('Failed to load profile. Check console for details.');
    }
  };

  // Debug calculations for CP-4/CP-5 features
  const runDebugCalculations = () => {
    if (debts.length === 0) {
      setCpCalculations(null);
      setCp4Forecast(null);
      setCp4Summary(null);
      return;
    }

    const totalBalance = debts.reduce((sum, debt) => sum + debt.amount, 0);
    const totalMinPayment = debts.reduce((sum, debt) => sum + debt.min_payment, 0);
    
    // Simple debt freedom calculation
    const avgAPR = debts.reduce((sum, debt) => sum + (debt.apr * debt.amount), 0) / totalBalance;
    const monthlyInterest = (totalBalance * avgAPR / 100) / 12;
    
    // Rough estimate of months to freedom with minimum payments
    const monthsToFreedom = totalBalance / (totalMinPayment - monthlyInterest);
    
    setCpCalculations({
      totalBalance,
      totalMinPayment,
      avgAPR: avgAPR.toFixed(2),
      monthlyInterest: monthlyInterest.toFixed(2),
      monthsToFreedom: monthsToFreedom.toFixed(1),
      estimatedFreedomDate: new Date(Date.now() + (monthsToFreedom * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString(),
      timestamp: new Date().toISOString()
    });

    // Run CP-4 simulation with dynamic snowball amount
    const forecast = simulateCompositeSnowballPlan(debts, snowballAmount, new Date());
    setCp4Forecast(forecast);

    if (forecast.errors && forecast.errors.length === 0) {
      const summary = generateCompositeforecastSummary(forecast);
      setCp4Summary(summary);
    }
  };

  // Update debug data
  useEffect(() => {
    setDebugData({
      profileCount: Object.keys(DEBUG_PROFILES).length,
      currentDebts: debts.length,
      totalBalance: debts.reduce((sum, debt) => sum + debt.amount, 0),
      timestamp: new Date().toISOString()
    });
    
    // Run calculations when debts or snowball amount change
    if (debts.length > 0) {
      runDebugCalculations();
    }
  }, [debts, currentProfile, snowballAmount]);

  return (
    <div className="space-y-8">
      {/* Debug Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🛠️ Debug Showcase & Testing Environment
        </h2>
        <p className="text-gray-600">
          Test all features with different debt scenarios. Data is wiped after each session.
        </p>
        
        {/* Debug Status */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Current Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Profile:</span> {DEBUG_PROFILES[currentProfile as keyof typeof DEBUG_PROFILES]?.name || 'Unknown'}
            </div>
            <div>
              <span className="text-blue-600">Debts:</span> {debts.length}
            </div>
            <div>
              <span className="text-blue-600">Total Debt:</span> {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(debts.reduce((sum, debt) => sum + debt.amount, 0))}
            </div>
            <div>
              <span className="text-blue-600">Min Payment:</span> {new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(debts.reduce((sum, debt) => sum + debt.min_payment, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🎭 Test Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(DEBUG_PROFILES).map(([key, profile]) => (
            <div 
              key={key}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                currentProfile === key 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => loadProfile(key)}
            >
              <div className="font-semibold text-gray-900">{profile.name}</div>
              <div className="text-sm text-gray-600 mt-1">{profile.description}</div>
              <div className="text-xs text-gray-500 mt-2">
                {profile.debts.length} debts • {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                  notation: 'compact'
                }).format(profile.debts.reduce((sum: number, d: DebugDebt) => sum + d.amount, 0))}
              </div>
            </div>
          ))}
        </div>
        
        {(createMutation.isPending || deleteMutation.isPending) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
              <span className="text-yellow-700 text-sm">Loading profile...</span>
            </div>
          </div>
        )}
      </div>

      {/* Calculation Engine Debug */}
      {cpCalculations && debts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧮 Calculation Engine</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Average APR</div>
              <div className="text-xl font-semibold text-gray-900">{cpCalculations.avgAPR}%</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Monthly Interest</div>
              <div className="text-xl font-semibold text-red-600">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                }).format(cpCalculations.monthlyInterest)}
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Months to Freedom</div>
              <div className="text-xl font-semibold text-green-600">{cpCalculations.monthsToFreedom}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Freedom Date</div>
              <div className="text-lg font-semibold text-blue-600">{cpCalculations.estimatedFreedomDate}</div>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={runDebugCalculations}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              🔄 Recalculate
            </button>
          </div>
        </div>
      )}

      {/* CP-4 Debug Panel */}
      {cp4Forecast && debts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 CP-4 Multi-APR Engine Debug</h3>
          
          {/* Snowball Amount Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Snowball Extra Payment</h4>
              <div className="text-lg font-semibold text-green-600">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                }).format(snowballAmount)}
              </div>
            </div>
            
            {/* Interactive Slider with Notches */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={snowballAmount}
                onChange={(e) => setSnowballAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                list="snowball-marks"
              />
              
              {/* Slider Notches/Marks */}
              <datalist id="snowball-marks">
                <option value="0" label="£0"></option>
                <option value="50" label="£50"></option>
                <option value="100" label="£100"></option>
                <option value="200" label="£200"></option>
                <option value="250" label="£250"></option>
                <option value="500" label="£500"></option>
                <option value="1000" label="£1000"></option>
              </datalist>
              
              {/* Visual notch markers */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>£0</span>
                <span>£50</span>
                <span>£100</span>
                <span>£200</span>
                <span>£250</span>
                <span>£500</span>
                <span>£1000</span>
              </div>
            </div>
          </div>

          {/* CP-4 Summary */}
          {cp4Summary && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">Forecast Summary ({new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(snowballAmount)} extra payment)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600">Months to Freedom</div>
                  <div className="text-xl font-semibold text-blue-900">{cp4Summary.monthsToClear}</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600">Total Interest</div>
                  <div className="text-xl font-semibold text-red-900">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                    }).format(cp4Summary.totalInterest)}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600">Monthly Payment</div>
                  <div className="text-xl font-semibold text-green-900">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                    }).format(cp4Summary.monthlyPayment)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Line Graph */}
          {cp4Forecast && cp4Forecast.monthlySnapshots.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">📈 Debt Freedom Forecast</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <svg width="100%" height="300" viewBox="0 0 800 300" className="overflow-visible">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="800" height="300" fill="url(#grid)" />
                  
                  {/* Calculate chart data */}
                  {(() => {
                    // Use all snapshots to show complete payoff
                    const snapshots = cp4Forecast.monthlySnapshots;
                    const maxBalance = Math.max(...snapshots.map(s => s.totalBalance));
                    
                    // Find when debt reaches zero
                    const freedomMonth = snapshots.findIndex(s => s.totalBalance < 0.01) + 1;
                    const displayMonths = freedomMonth > 0 ? freedomMonth : snapshots.length;
                    const displaySnapshots = snapshots.slice(0, displayMonths);
                    
                    // Calculate minimum payment scenario for comparison
                    const minPaymentData = debts.reduce((sum, debt) => sum + debt.min_payment, 0);
                    const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);
                    const avgAPR = debts.reduce((sum, debt) => sum + (debt.apr * debt.amount), 0) / (totalDebt || 1);
                    const monthlyInterest = (totalDebt * avgAPR / 100) / 12;
                    const minPaymentMonths = Math.min(360, totalDebt / Math.max(1, minPaymentData - monthlyInterest)); // Cap at 30 years
                    
                    // Generate path for snowball (actual data)
                    const snowballPath = displaySnapshots.map((snapshot, index) => {
                      const x = (index / Math.max(1, displayMonths - 1)) * 750 + 25;
                      const y = 275 - (snapshot.totalBalance / maxBalance) * 250;
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');
                    
                    // Add final point at zero if debt is paid off
                    const finalSnowballPath = freedomMonth > 0 
                      ? snowballPath + ` L ${775} ${275}`
                      : snowballPath;
                    
                    // Generate path for minimum payment scenario (theoretical)
                    const minPaymentPoints = Math.min(Math.ceil(minPaymentMonths), displayMonths * 2);
                    const minPaymentPath = Array.from({ length: minPaymentPoints }, (_, index) => {
                      const progress = index / (minPaymentPoints - 1);
                      const monthlyBalance = totalDebt * (1 - progress);
                      const x = progress * 750 + 25;
                      const y = 275 - (Math.max(0, monthlyBalance) / maxBalance) * 250;
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ');
                    
                    return (
                      <>
                        {/* Minimum payments line (red) */}
                        <path
                          d={minPaymentPath}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeDasharray="5,5"
                        />
                        
                        {/* Snowball line (green) */}
                        <path
                          d={finalSnowballPath}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                        
                        {/* Y-axis labels */}
                        <text x="10" y="30" fontSize="12" fill="#6b7280">
                          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact' }).format(maxBalance)}
                        </text>
                        <text x="10" y="160" fontSize="12" fill="#6b7280">
                          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', notation: 'compact' }).format(maxBalance / 2)}
                        </text>
                        <text x="10" y="290" fontSize="12" fill="#6b7280">£0</text>
                        
                        {/* X-axis labels */}
                        <text x="25" y="315" fontSize="12" fill="#6b7280">0</text>
                        <text x="400" y="315" fontSize="12" fill="#6b7280">{Math.floor(displayMonths / 2)} mo</text>
                        <text x="750" y="315" fontSize="12" fill="#6b7280">{displayMonths} mo</text>
                        
                        {/* Freedom markers */}
                        {freedomMonth > 0 && (
                          <>
                            <circle cx="775" cy="275" r="5" fill="#10b981" />
                            <text x="775" y="265" fontSize="11" fill="#10b981" textAnchor="middle">
                              DEBT FREE!
                            </text>
                          </>
                        )}
                      </>
                    );
                  })()}
                </svg>
                
                {/* Legend */}
                <div className="flex justify-center mt-4 space-x-6">
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 bg-green-500 mr-2"></div>
                    <span className="text-sm text-gray-600">With £{snowballAmount} Snowball</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-0.5 border-b-2 border-dashed border-red-500 mr-2"></div>
                    <span className="text-sm text-gray-600">Minimum Payments Only</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Month-by-Month Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
            >
              {showMonthlyBreakdown ? '📊 Hide' : '📊 Show'} Month-by-Month Breakdown
            </button>
            {showMonthlyBreakdown && cp4Forecast.monthlySnapshots.length > 0 && (
              <div className="ml-4 mt-2">
                <label className="text-sm text-gray-600 mr-2">Jump to month:</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {cp4Forecast.monthlySnapshots.slice(0, 24).map((snapshot, index) => (
                    <option key={snapshot.month} value={snapshot.month}>
                      Month {snapshot.month}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Monthly Breakdown Details */}
          {showMonthlyBreakdown && cp4Forecast.monthlySnapshots.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              {(() => {
                const snapshot = cp4Forecast.monthlySnapshots.find(s => s.month === selectedMonth);
                if (!snapshot) return <div>No data for selected month</div>;
                
                return (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-3">Month {snapshot.month} Breakdown</h5>
                    
                    {/* Month Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                      <div className="p-2 bg-gray-50 rounded">
                        <div className="text-gray-600">Total Balance</div>
                        <div className="font-semibold">
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                          }).format(snapshot.totalBalance)}
                        </div>
                      </div>
                      <div className="p-2 bg-red-50 rounded">
                        <div className="text-red-600">Interest Paid</div>
                        <div className="font-semibold text-red-800">
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                          }).format(snapshot.totalInterest)}
                        </div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-blue-600">Principal Paid</div>
                        <div className="font-semibold text-blue-800">
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                          }).format(snapshot.totalPrincipal)}
                        </div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-green-600">Snowball Applied</div>
                        <div className="font-semibold text-green-800">
                          {new Intl.NumberFormat('en-GB', {
                            style: 'currency',
                            currency: 'GBP',
                          }).format(snapshot.snowballApplied)}
                        </div>
                      </div>
                    </div>

                    {/* Debt-by-Debt Breakdown */}
                    <div className="space-y-3">
                      {Object.values(snapshot.debts).map((debt) => (
                        <div key={debt.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="font-medium text-gray-900">{debt.name}</h6>
                            <div className="text-sm text-gray-600">
                              Balance: {new Intl.NumberFormat('en-GB', {
                                style: 'currency',
                                currency: 'GBP',
                              }).format(debt.totalBalance)}
                              {debt.isPaidOff && <span className="ml-2 text-green-600 font-semibold">✅ PAID OFF</span>}
                            </div>
                          </div>
                          
                          {/* Bucket Breakdown */}
                          {debt.buckets.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                              {debt.buckets.map((bucket) => (
                                <div key={bucket.id} className="p-2 bg-gray-50 rounded">
                                  <div className="font-medium">{bucket.name}</div>
                                  <div className="text-gray-600">{bucket.apr.toFixed(2)}% APR</div>
                                  <div className="text-gray-800">
                                    Balance: {new Intl.NumberFormat('en-GB', {
                                      style: 'currency',
                                      currency: 'GBP',
                                    }).format(bucket.balance)}
                                  </div>
                                  <div className="text-red-600">
                                    Interest: {new Intl.NumberFormat('en-GB', {
                                      style: 'currency',
                                      currency: 'GBP',
                                    }).format(bucket.interest)}
                                  </div>
                                  <div className="text-blue-600">
                                    Principal: {new Intl.NumberFormat('en-GB', {
                                      style: 'currency',
                                      currency: 'GBP',
                                    }).format(bucket.principal)}
                                  </div>
                                  {bucket.isPaidOff && <div className="text-green-600 font-semibold">✅</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Newly Paid Off This Month */}
                    {(snapshot.newlyPaidOffDebts.length > 0 || snapshot.newlyPaidOffBuckets.length > 0) && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h6 className="font-medium text-green-800 mb-2">🎉 Paid Off This Month</h6>
                        {snapshot.newlyPaidOffDebts.length > 0 && (
                          <div className="text-sm text-green-700">
                            <strong>Debts:</strong> {snapshot.newlyPaidOffDebts.join(', ')}
                          </div>
                        )}
                        {snapshot.newlyPaidOffBuckets.length > 0 && (
                          <div className="text-sm text-green-700">
                            <strong>Buckets:</strong> {snapshot.newlyPaidOffBuckets.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Errors Display */}
          {cp4Forecast.errors && cp4Forecast.errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h6 className="font-medium text-red-800 mb-2">⚠️ CP-4 Calculation Errors</h6>
              <ul className="text-sm text-red-700 list-disc list-inside">
                {cp4Forecast.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Feature Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UK Debt Types */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🇬🇧 UK Debt Types</h3>
          <div className="space-y-2">
            {debts.map((debt, index) => (
              <div key={debt.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="font-medium text-gray-900">{debt.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{debt.debt_type?.replace('_', ' ') || 'Unknown'}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {new Intl.NumberFormat('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      notation: 'compact'
                    }).format(debt.amount)}
                  </div>
                  <div className="text-sm text-gray-500">{debt.apr.toFixed(2)}% APR</div>
                </div>
              </div>
            ))}
            
            {debts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No debts loaded. Select a profile to see debt data.
              </div>
            )}
          </div>
        </div>

        {/* Analytics & Events */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Analytics & Events</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm font-medium text-green-800">✅ Profile Loaded</div>
              <div className="text-xs text-green-600 mt-1">profile_switched: {currentProfile}</div>
            </div>
            
            {debts.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">📈 Calculations Updated</div>
                <div className="text-xs text-blue-600 mt-1">forecast_calculated: {debts.length} debts</div>
              </div>
            )}
            
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-800">🔄 Session Active</div>
              <div className="text-xs text-gray-600 mt-1">No data persisted locally</div>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Dump */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Raw Data Debug</h3>
        <details className="group">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 mb-2">
            Show debug data →
          </summary>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64 text-gray-800">
            {JSON.stringify({
              currentProfile,
              debugData,
              debts: debts.map(d => ({
                id: d.id,
                name: d.name,
                amount: d.amount,
                apr: d.apr,
                min_payment: d.min_payment,
                debt_type: d.debt_type
              })),
              calculations: cpCalculations
            }, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default DebugShowcase;