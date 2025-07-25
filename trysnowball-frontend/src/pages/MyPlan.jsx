import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { useDataManager } from '../hooks/useDataManager';
import UpdateBalances from '../components/UpdateBalances';
import ProgressNotification from '../components/ProgressNotification';
import TrendChart from '../components/TrendChart';
import SnowballChart from '../components/SnowballChart';
import NoDebtsState from '../components/NoDebtsState';

const MyPlan = () => {
  const { colors } = useTheme();
  const { debts: dataManagerDebts } = useDataManager();
  const [activeTab, setActiveTab] = useState('debts');
  const [showUpdateBalances, setShowUpdateBalances] = useState(false);
  const [debtsData, setDebtsData] = useState(null);
  const [showProgressNotification, setShowProgressNotification] = useState(false);
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [demoDataCleared, setDemoDataCleared] = useState(false);

  // Check if demo data was manually cleared and get last update info
  React.useEffect(() => {
    const wasCleared = localStorage.getItem('demoDataCleared') === 'true';
    setDemoDataCleared(wasCleared);
  }, []);

  // Get last update information
  const getLastUpdateInfo = () => {
    if (debtsData) {
      // Real data from balance updates
      const lastUpdate = localStorage.getItem('lastBalanceUpdate');
      if (lastUpdate) {
        const date = new Date(lastUpdate);
        return `Last updated: ${date.toLocaleDateString()} • Using your current data`;
      }
      return 'Recently updated • Using your current data';
    } else if (demoDataCleared) {
      return 'Demo data cleared • Ready for your real information';
    } else {
      return 'Using demo data • Add your real information to get started';
    }
  };

  const handleBalanceUpdate = (updatedDebts) => {
    setDebtsData(updatedDebts);
    // Here you could also save to localStorage or send to a backend
    localStorage.setItem('debtBalances', JSON.stringify(updatedDebts));
    localStorage.setItem('lastBalanceUpdate', new Date().toISOString());
    
    // Show progress notification
    setShowProgressNotification(true);
  };

  const handleClearDemoData = () => {
    // Clear all demo/baseline data from localStorage
    localStorage.removeItem('debtBalances');
    localStorage.removeItem('babyStepsProgress');
    localStorage.removeItem('trysnowball-spending-breakdown');
    localStorage.removeItem('lastBalanceUpdate');
    
    // Mark demo data as cleared
    localStorage.setItem('demoDataCleared', 'true');
    
    // Reset local state
    setDebtsData(null);
    setDemoDataCleared(true);
    setShowClearDemoModal(false);
    
    // Show success message
    alert('Demo data cleared! You can now add your real debt information.');
  };

  // Use dataManager debts if we don't have local debtsData
  const currentDebts = debtsData || (dataManagerDebts.length > 0 ? dataManagerDebts : null);
  
  // Check if we're using demo/baseline data
  const usingDemoData = !currentDebts && !demoDataCleared;
  
  // Check if there's truly no debt data anywhere
  const hasNoDebtData = !currentDebts && demoDataCleared;

  const tabs = [
    { id: 'debts', label: 'My Debts & Progress', icon: '💳' },
    { id: 'strategy', label: 'Strategy', icon: '🎯' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
  ];

  // If there's truly no debt data anywhere, show main no-data state
  if (hasNoDebtData) {
    return (
      <div className={`min-h-screen ${colors.background}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NoDebtsState 
            title="Add Your Debts Now"
            subtitle="Get started on your debt freedom journey by adding your debt information. We'll help you create a personalized plan to pay everything off faster."
            icon="💳"
            showSecondaryActions={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className={`${colors.surface} rounded-lg shadow-sm p-6 mb-8`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${colors.text.primary} mb-2`}>
                My Debt Freedom Plan
              </h1>
              <p className={`${colors.text.secondary} text-lg`}>
                Your personalized roadmap to becoming debt-free
              </p>
              <p className={`${colors.text.muted} text-sm mt-1`}>
                {getLastUpdateInfo()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {usingDemoData ? (
                <button
                  data-testid="clear-demo-data-btn"
                  onClick={() => setShowClearDemoModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Clear Demo Data</span>
                </button>
              ) : currentDebts ? (
                <button
                  data-testid="update-balances-btn"
                  onClick={() => setShowUpdateBalances(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>📊</span>
                  <span>Update Balances</span>
                </button>
              ) : (
                <Link 
                  data-testid="add-debts-btn"
                  to="/debts"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
                >
                  <span>💳</span>
                  <span>Add Debts</span>
                </Link>
              )}
              <div className="text-6xl">🎯</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`${colors.surface} rounded-lg shadow-sm mb-8`}>
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-primary text-primary bg-primary/5'
                    : `${colors.text.secondary} hover:${colors.text.primary} hover:bg-gray-50`
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'debts' && <DebtsTab colors={colors} debtsData={currentDebts} demoDataCleared={demoDataCleared} hasNoDebtData={hasNoDebtData} />}
            {activeTab === 'strategy' && <StrategyTab colors={colors} debtsData={currentDebts} demoDataCleared={demoDataCleared} hasNoDebtData={hasNoDebtData} />}
            {activeTab === 'timeline' && <TimelineTab colors={colors} debtsData={currentDebts} demoDataCleared={demoDataCleared} hasNoDebtData={hasNoDebtData} />}
          </div>
        </div>
      </div>

      {/* Update Balances Modal */}
      {showUpdateBalances && (
        <UpdateBalances
          onClose={() => setShowUpdateBalances(false)}
          onUpdate={handleBalanceUpdate}
        />
      )}

      {/* Progress Notification */}
      {showProgressNotification && currentDebts && (
        <ProgressNotification
          totalProgress={currentDebts.reduce((sum, debt) => sum + (debt.january - debt.balance), 0)}
          onDismiss={() => setShowProgressNotification(false)}
        />
      )}

      {/* Clear Demo Data Modal */}
      {showClearDemoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${colors.surface} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <h3 className={`text-xl font-bold ${colors.text.primary} mb-4`}>Clear Demo Data</h3>
            <p className={`${colors.text.secondary} mb-6`}>
              This will remove all demo debt information and progress data. You'll be able to start fresh with your real debt information.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleClearDemoData}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Clear Demo Data
              </button>
              <button
                onClick={() => setShowClearDemoModal(false)}
                className={`flex-1 px-4 py-2 border ${colors.border} rounded-lg hover:${colors.surfaceSecondary} transition-colors font-medium`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Debts Tab Component (now includes progress tracking)
const DebtsTab = ({ colors, debtsData, demoDataCleared }) => {
  const [selectedDebtId, setSelectedDebtId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Sample milestones from your real progress
  const recentMilestones = [
    {
      milestoneId: 'milestone_flex_progress',
      title: 'Flex Card Nearly Gone! 🎯',
      description: 'Amazing progress on Flex card - reduced by £2,002 in 6 months!',
      achievedAt: '2024-07-01T00:00:00.000Z'
    },
    {
      milestoneId: 'milestone_halifax1_progress', 
      title: 'Halifax 1 Massive Progress! 💪',
      description: 'Incredible work - reduced Halifax 1 by £8,692 in 6 months!',
      achievedAt: '2024-07-01T00:00:00.000Z'
    },
    {
      milestoneId: 'milestone_total_reduction',
      title: '£9,655 Total Debt Reduction! 🔥',
      description: 'You\'ve reduced your total debt by £9,655 over 6 months!',
      achievedAt: '2024-07-01T00:00:00.000Z'
    }
  ];

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedDebtId || !paymentAmount) return;
    
    const selectedDebt = debts.find(d => d.name === selectedDebtId);
    alert(`Payment of £${paymentAmount} recorded for ${selectedDebt?.name}`);
    setPaymentAmount('');
    setSelectedDebtId('');
  };
  // Historical data for trend charts (July 2024 to January 2025)
  const getHistoricalData = (debtName) => {
    const historicalData = {
      'Paypal': [
        { date: '2024-07-01', balance: 780 },
        { date: '2024-10-01', balance: 1100 },
        { date: '2025-01-01', balance: 1400 }
      ],
      'Flex': [
        { date: '2024-07-01', balance: 4252 },
        { date: '2024-10-01', balance: 3000 },
        { date: '2025-01-01', balance: 2250 }
      ],
      'Barclaycard': [
        { date: '2024-07-01', balance: 2863 },
        { date: '2024-10-01', balance: 2600 },
        { date: '2025-01-01', balance: 2461 }
      ],
      'Virgin': [
        { date: '2024-07-01', balance: 5583 },
        { date: '2024-10-01', balance: 5100 },
        { date: '2025-01-01', balance: 4762 }
      ],
      'MBNA': [
        { date: '2024-07-01', balance: 6248 },
        { date: '2024-10-01', balance: 6000 },
        { date: '2025-01-01', balance: 5931 }
      ],
      'Natwest': [
        { date: '2024-07-01', balance: 6486 },
        { date: '2024-10-01', balance: 6700 },
        { date: '2025-01-01', balance: 6820 }
      ],
      'Halifax 2': [
        { date: '2024-07-01', balance: 9040 },
        { date: '2024-10-01', balance: 8800 },
        { date: '2025-01-01', balance: 8587 }
      ],
      'Halifax 1': [
        { date: '2024-07-01', balance: 20386 },
        { date: '2024-10-01', balance: 16000 },
        { date: '2025-01-01', balance: 11694 }
      ]
    };
    return historicalData[debtName] || [];
  };

  // Default January 2025 baseline data with historical data
  const baselineDebts = [
    { name: 'Paypal', balance: 1400, rate: 20, min: 255, type: 'Credit Card', trend: -620, progress: 'excellent', historical: getHistoricalData('Paypal') },
    { name: 'Flex', balance: 2250, rate: 20, min: 70, type: 'Credit Card', trend: -2002, progress: 'excellent', historical: getHistoricalData('Flex') },
    { name: 'Barclaycard', balance: 2461, rate: 20, min: 75, type: 'Credit Card', trend: 402, progress: 'concern', historical: getHistoricalData('Barclaycard') },
    { name: 'Virgin', balance: 4762, rate: 20, min: 255, type: 'Credit Card', trend: 821, progress: 'concern', historical: getHistoricalData('Virgin') },
    { name: 'MBNA', balance: 5931, rate: 20, min: 255, type: 'Credit Card', trend: 317, progress: 'concern', historical: getHistoricalData('MBNA') },
    { name: 'Natwest', balance: 6820, rate: 20, min: 70, type: 'Credit Card', trend: -334, progress: 'good', historical: getHistoricalData('Natwest') },
    { name: 'Halifax 2', balance: 8587, rate: 20, min: 215, type: 'Credit Card', trend: 453, progress: 'concern', historical: getHistoricalData('Halifax 2') },
    { name: 'Halifax 1', balance: 11694, rate: 20, min: 300, type: 'Credit Card', trend: -8692, progress: 'excellent', historical: getHistoricalData('Halifax 1') },
  ];

  // Use updated data if available, otherwise use baseline (unless cleared)
  const debts = debtsData ? debtsData.map(debt => ({
    name: debt.name,
    balance: debt.balance || debt.amount || 0, // Handle both dataManager (amount) and local (balance) formats
    rate: debt.interest || 20, // Use actual interest rate or default to 20%
    min: debt.minPayment || debt.regularPayment || 0, // Handle both formats
    type: 'Credit Card',
    trend: (debt.january || 0) - (debt.balance || debt.amount || 0), // Calculate new trend from January baseline
    progress: debt.progress?.status || 'neutral',
    january: debt.january || debt.amount || 0, // Fallback if no January data
    historical: [...getHistoricalData(debt.name), { date: '2025-02-01', balance: debt.balance || debt.amount || 0 }] // Add current balance as latest point
  })) : (demoDataCleared ? [] : baselineDebts);

  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinPayments = debts.reduce((sum, debt) => sum + debt.min, 0);
  const activeDebts = debts.length;

  const getProgressColor = (progress) => {
    switch (progress) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'concern': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend < -500) return '📉💚'; // Major reduction
    if (trend < 0) return '📉'; // Reduction
    if (trend > 500) return '📈⚠️'; // Major increase
    if (trend > 0) return '📈'; // Increase
    return '➡️'; // Stable
  };

  // Show empty state if demo data was cleared and no real data added
  if (demoDataCleared && debts.length === 0) {
    return (
      <NoDebtsState 
        title="Ready to Create Your Plan!"
        subtitle="Demo data has been cleared. Add your real debt information to create your personalized debt freedom plan."
        icon="🎯"
        showSecondaryActions={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Current Debts Overview</h2>
        <Link 
          to="/debts"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Manage Debts
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-red-600">£{totalBalance.toLocaleString()}</div>
          <div className={`text-sm ${colors.text.muted}`}>Total Debt Balance</div>
        </div>
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-orange-600">£{totalMinPayments.toLocaleString()}</div>
          <div className={`text-sm ${colors.text.muted}`}>Monthly Minimums</div>
        </div>
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-blue-600">{activeDebts}</div>
          <div className={`text-sm ${colors.text.muted}`}>Active Debts</div>
        </div>
      </div>

      {/* Your Real Debt List */}
      <div className="space-y-3">
        <h3 className={`font-medium ${colors.text.primary}`}>Your Debts (Your Real Data)</h3>
        <div className="space-y-2">
          {debts.map((debt, index) => (
            <div key={index} className={`p-4 border rounded-lg ${colors.border} hover:shadow-sm transition-shadow`}>
              <div className="grid grid-cols-6 gap-4 items-center">
                {/* Debt Name & Progress Icon */}
                <div className="col-span-1">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium ${colors.text.primary}`}>{debt.name}</h4>
                    <span className="text-lg">{getTrendIcon(debt.trend)}</span>
                  </div>
                </div>
                
                {/* Debt Type */}
                <div className="col-span-1">
                  <p className={`text-sm ${colors.text.muted}`}>{debt.type}</p>
                  <p className={`text-xs ${colors.text.muted}`}>{debt.rate}% APR</p>
                </div>
                
                {/* 6-Month Progress */}
                <div className="col-span-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    debt.progress === 'excellent' ? 'bg-green-100 text-green-800' :
                    debt.progress === 'good' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {debt.trend < 0 ? `↓ £${Math.abs(debt.trend)}` : `↑ £${debt.trend}`}
                  </span>
                  <p className={`text-xs ${colors.text.muted} mt-1`}>(6mo)</p>
                </div>
                
                {/* Current Balance */}
                <div className="col-span-1">
                  <div className={`text-lg font-semibold ${getProgressColor(debt.progress)}`}>
                    £{debt.balance.toLocaleString()}
                  </div>
                  <div className={`text-xs ${colors.text.muted}`}>Min payment: £{debt.min}</div>
                </div>
                
                {/* Trend Chart */}
                <div className="col-span-2 flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-gray-500 mb-1">6mo trend</div>
                    <TrendChart data={debt.historical} width={100} height={35} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className={`p-4 rounded-lg ${debtsData ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border`}>
        <h3 className={`font-semibold mb-2 ${debtsData ? 'text-green-900' : 'text-blue-900'}`}>
          {debtsData ? 'Updated Progress Summary' : '6-Month Progress Summary (January 2025)'}
        </h3>
        
        {debtsData ? (
          <div className="space-y-3">
            <div className="text-sm">
              <span className="font-medium text-green-800">🎉 Total progress since January: </span>
              <span className="text-green-700 font-bold">
                £{debts.reduce((sum, debt) => sum + (debt.january - debt.balance), 0).toLocaleString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700 font-medium">✅ Improving:</span>
                <div className="text-green-600">
                  {debts.filter(d => d.trend > 0).map(d => `${d.name} (-£${d.trend})`).join(', ') || 'None'}
                </div>
              </div>
              <div>
                <span className="text-red-700 font-medium">⚠️ Increased:</span>
                <div className="text-red-600">
                  {debts.filter(d => d.trend < 0).map(d => `${d.name} (+£${Math.abs(d.trend)})`).join(', ') || 'None'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700 font-medium">✅ Excellent Progress:</span>
              <div className="text-green-600">Flex (-£2,002), Halifax 1 (-£8,692), Paypal (-£620)</div>
            </div>
            <div>
              <span className="text-red-700 font-medium">⚠️ Needs Attention:</span>
              <div className="text-red-600">Virgin (+£821), Halifax 2 (+£453), Barclaycard (+£402)</div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Achievements Section */}
      {recentMilestones.length > 0 && (
        <div className={`${colors.surface} rounded-lg shadow p-6`}>
          <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Recent Achievements 🎉</h3>
          <div className="space-y-3">
            {recentMilestones.map(milestone => (
              <div key={milestone.milestoneId} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="text-2xl">🏆</div>
                <div>
                  <h4 className="font-semibold text-green-800">{milestone.title}</h4>
                  <p className="text-sm text-green-600">{milestone.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(milestone.achievedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Section */}
      <div className={`${colors.surface} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Record Payment</h3>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={selectedDebtId}
              onChange={(e) => setSelectedDebtId(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${colors.border}`}
              required
            >
              <option value="">Select debt</option>
              {debts.map((debt, index) => (
                <option key={index} value={debt.name}>
                  {debt.name} (Min payment: £{debt.min})
                </option>
              ))}
            </select>
            
            <input
              type="number"
              step="0.01"
              placeholder="Payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className={`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${colors.border}`}
              required
            />
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Record Payment
          </button>
        </form>
        
        <div className={`mt-4 p-3 ${colors.surfaceSecondary} rounded-lg`}>
          <p className={`text-sm ${colors.text.secondary}`}>
            💡 <strong>Tip:</strong> Record payments as you make them to track your progress and unlock achievements!
          </p>
        </div>
      </div>

      {/* Progress Insights */}
      <div className={`${colors.surface} rounded-lg shadow p-6`}>
        <h3 className={`text-lg font-semibold ${colors.text.primary} mb-4`}>Progress Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-green-800 mb-2">🎯 Momentum Builders</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Halifax 1: £8,692 reduction - incredible progress!</li>
              <li>• Flex: £2,002 reduction - almost eliminated!</li>
              <li>• Consistent extra payments showing results</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-orange-800 mb-2">⚠️ Focus Areas</h4>
            <ul className="text-sm text-orange-700 space-y-1">
              <li>• Virgin: £821 increase - review spending</li>
              <li>• Halifax 2: £453 increase - needs attention</li>
              <li>• Consider balance transfer options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Strategy Tab Component
const StrategyTab = ({ colors, debtsData, demoDataCleared, hasNoDebtData }) => {
  if (hasNoDebtData) {
    return (
      <NoDebtsState 
        title="Strategy Awaiting Your Data"
        subtitle="Once you add your debt information, we'll create a personalized snowball strategy for you."
        icon="🎯"
      />
    );
  }

  return (
    <div className="space-y-6">
      <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Your Debt Payoff Strategy</h2>
      
      {/* Strategy Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 border-2 border-primary rounded-lg ${colors.surface}`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">❄️</div>
            <div>
              <h3 className="text-lg font-semibold text-primary">Debt Snowball</h3>
              <div className="px-2 py-1 bg-primary text-white text-xs rounded-full inline-block">SELECTED</div>
            </div>
          </div>
          <p className={`${colors.text.secondary} mb-4`}>
            Pay minimums on all debts, then attack the smallest balance first. 
            Build momentum with quick wins!
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>✅ Psychological wins</span>
              <span>✅ Clear motivation</span>
            </div>
            <div className="flex justify-between">
              <span>✅ Simple to follow</span>
              <span>⚠️ More interest paid</span>
            </div>
          </div>
        </div>

        <div className={`p-6 border rounded-lg ${colors.border} opacity-60`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-2xl">🏔️</div>
            <div>
              <h3 className="text-lg font-semibold">Debt Avalanche</h3>
              <button className="text-xs text-primary hover:underline">Switch Strategy</button>
            </div>
          </div>
          <p className={`${colors.text.secondary} mb-4`}>
            Pay minimums on all debts, then attack the highest interest rate first. 
            Mathematically optimal approach.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>✅ Less interest paid</span>
              <span>✅ Faster payoff</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Slower motivation</span>
              <span>⚠️ Requires discipline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Strategy Details */}
      <div className={`p-6 border rounded-lg ${colors.border} bg-primary/5`}>
        <h3 className={`font-semibold ${colors.text.primary} mb-4`}>Your Snowball Order (Smallest to Largest)</h3>
        <div className="space-y-3">
          {debtsData
            .filter(debt => debt.balance > 0) // Only show debts with balances
            .sort((a, b) => a.balance - b.balance) // Sort by balance (smallest first)
            .map((debt, index) => {
              const order = index + 1;
              const status = index === 0 ? 'next' : index === 1 ? 'almost' : 'future';
              const progress = debt.progress || 'neutral';
              
              return (
            <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
              status === 'next' ? 'bg-green-50 border border-green-200' :
              status === 'almost' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  status === 'next' ? 'bg-green-500 text-white' :
                  status === 'almost' ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                  {order}
                </div>
                <div>
                  <div className="font-medium">{debt.name}</div>
                  <div className="text-sm text-gray-600">£{debt.balance.toLocaleString()}</div>
                  <div className={`text-xs ${
                    progress === 'excellent' ? 'text-green-600' :
                    progress === 'good' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {progress === 'excellent' ? '📉 Great progress' :
                     progress === 'good' ? '↘️ Making progress' : '📈 Balance increased'}
                  </div>
                </div>
              </div>
              {status === 'next' && (
                <div className="px-3 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                  FOCUS HERE
                </div>
              )}
              {status === 'almost' && (
                <div className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                  ALMOST DONE
                </div>
              )}
            </div>
              );
            })}
        </div>
        
        {/* Strategy Note */}
        <div className={`mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg`}>
          <p className="text-sm text-blue-800">
            <strong>💡 Your Strategy:</strong> You're doing great! Focus extra payments on Paypal (£1,400) first, 
            then Flex (£2,250). Your Halifax 1 progress is incredible - keep that momentum going!
          </p>
        </div>
      </div>
    </div>
  );
};

// Timeline Tab Component
const TimelineTab = ({ colors, debtsData, demoDataCleared, hasNoDebtData }) => {
  if (hasNoDebtData) {
    return (
      <NoDebtsState 
        title="Timeline Awaiting Your Data"
        subtitle="Once you add your debt information, we'll show you exactly when you'll be debt-free with interactive projections."
        icon="📅"
      />
    );
  }

  // Convert debtsData to format expected by SnowballChart
  const chartDebts = debtsData ? debtsData.map(debt => ({
    name: debt.name,
    balance: debt.balance,
    rate: 20, // All cards are 20% APR
    minPayment: debt.minPayment
  })) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${colors.text.primary}`}>Debt Freedom Timeline</h2>
        <Link 
          to="/what-if"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Advanced Scenarios
        </Link>
      </div>

      {/* Interactive Snowball Chart */}
      <SnowballChart 
        debts={chartDebts}
        extraPayment={500}
        colors={colors}
      />

      {/* Timeline Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-green-600">24 months</div>
          <div className={`text-sm ${colors.text.muted}`}>Estimated Time to Freedom</div>
        </div>
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-blue-600">£1,000</div>
          <div className={`text-sm ${colors.text.muted}`}>Suggested Extra Payment</div>
        </div>
        <div className={`p-4 rounded-lg border ${colors.border}`}>
          <div className="text-2xl font-bold text-purple-600">£8,500</div>
          <div className={`text-sm ${colors.text.muted}`}>Interest Saved vs Min Payments</div>
        </div>
      </div>

      {/* Milestone Timeline */}
      <div className={`p-6 border rounded-lg ${colors.border}`}>
        <h3 className={`font-semibold ${colors.text.primary} mb-4`}>Your Realistic Debt Freedom Timeline</h3>
        <div className="space-y-4">
          {[
            { date: 'Mar 2025', milestone: 'Paypal Paid Off! 🎉', amount: '£1,400', status: 'upcoming' },
            { date: 'Jun 2025', milestone: 'Flex Card Eliminated! 💪', amount: '£2,250', status: 'future' },
            { date: 'Sep 2025', milestone: 'Barclaycard Gone! 🔥', amount: '£2,461', status: 'future' },
            { date: 'Feb 2026', milestone: 'Virgin Card Defeated! ⚡', amount: '£4,762', status: 'future' },
            { date: 'Jul 2026', milestone: 'MBNA Finished! 🚀', amount: '£5,931', status: 'future' },
            { date: 'Dec 2026', milestone: 'Natwest Complete! 🎯', amount: '£6,820', status: 'future' },
            { date: 'Jun 2027', milestone: 'Halifax 2 Done! 💥', amount: '£8,587', status: 'future' },
            { date: 'Dec 2027', milestone: 'DEBT FREE! 🏆🎊', amount: '£42,905', status: 'goal' },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`w-4 h-4 rounded-full ${
                item.status === 'upcoming' ? 'bg-yellow-400' :
                item.status === 'goal' ? 'bg-green-500' : 'bg-gray-300'
              }`}></div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{item.milestone}</div>
                    <div className={`text-sm ${colors.text.muted}`}>{item.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{item.amount}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Note */}
        <div className={`mt-4 p-3 bg-green-50 border border-green-200 rounded-lg`}>
          <p className="text-sm text-green-800">
            <strong>🎯 You're already making excellent progress!</strong> Your Halifax 1 reduction (-£8,692) 
            and Flex progress (-£2,002) show you have the momentum to be debt-free in under 3 years.
          </p>
        </div>
      </div>

      {/* Action Items */}
      <div className={`p-6 border rounded-lg ${colors.border} bg-blue-50`}>
        <h3 className={`font-semibold ${colors.text.primary} mb-4`}>February 2025 Action Plan</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-primary" />
            <span>Make minimum payments on all debts (£1,495)</span>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-primary" />
            <span>Focus extra £500 on Paypal (smallest debt first!)</span>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-primary" />
            <span>Stop using cards with increasing balances (Virgin, Halifax 2, MBNA)</span>
          </div>
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="w-4 h-4 text-primary" />
            <span>Celebrate your Halifax 1 success - you're crushing it! 🎉</span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default MyPlan;