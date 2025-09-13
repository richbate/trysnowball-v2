import React, { useState, useEffect } from 'react';
import { Card, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DebtFormModal } from '../components/debt/DebtFormModal';
import { DebtTable } from '../components/debt/DebtTable';
import { HeroForecast } from '../components/home/HeroForecast';
import { TeaserGoals } from '../components/home/TeaserGoals';
import { AchievementsChecklist } from '../components/account/AchievementsChecklist';
import { ShareCard } from '../components/share/ShareCard';
import { PaymentStrategyExplainer } from '../components/PaymentStrategyExplainer';
import { CommitmentGenerator } from '../components/CommitmentGenerator';
import { GPTCoachChat } from '../components/ai/GPTCoachChat';
import { useDebts } from '../hooks/useDebts';
import { useSettings } from '../hooks/useSettings';

const DEBUG_PROFILES = {
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
      id: 'cc1',
      name: 'Chase Freedom',
      balance: 3500,
      apr: 23.99,
      minimumPayment: 105,
      type: 'credit_card'
    }],
    settings: { strategy: 'snowball', extraPayment: 200 }
  },
  'multi-apr-pro': {
    name: '🎯 Multi-APR Pro Demo',
    description: 'Complex credit card with different APR buckets (CP-4)',
    debts: [{
      id: 'cc-complex',
      name: 'Card with Multiple APRs',
      balance: 3000,
      apr: 22.9, // Overall APR
      minimumPayment: 100,
      type: 'credit_card',
      buckets: [
        { id: 'b1', name: 'Cash Advances', balance: 500, apr: 27.9, payment_priority: 1 },
        { id: 'b2', name: 'Purchases', balance: 1000, apr: 22.9, payment_priority: 2 },
        { id: 'b3', name: 'Balance Transfer', balance: 1500, apr: 0.0, payment_priority: 3 }
      ]
    }],
    settings: { strategy: 'avalanche', extraPayment: 100, tier: 'pro' }
  },
  'family-debt': {
    name: '👨‍👩‍👧‍👦 Family Debt Load',
    description: 'Typical family with multiple debt types',
    debts: [
      {
        id: 'mortgage',
        name: 'Home Mortgage',
        balance: 285000,
        apr: 6.5,
        minimumPayment: 1847,
        type: 'mortgage'
      },
      {
        id: 'car1',
        name: 'Toyota RAV4',
        balance: 18500,
        apr: 4.9,
        minimumPayment: 387,
        type: 'auto'
      },
      {
        id: 'cc1',
        name: 'Chase Sapphire',
        balance: 4200,
        apr: 21.99,
        minimumPayment: 126,
        type: 'credit_card'
      },
      {
        id: 'cc2',
        name: 'Target RedCard',
        balance: 850,
        apr: 25.99,
        minimumPayment: 35,
        type: 'credit_card'
      },
      {
        id: 'student',
        name: 'Student Loans',
        balance: 12300,
        apr: 5.8,
        minimumPayment: 145,
        type: 'student'
      }
    ],
    settings: { strategy: 'snowball', extraPayment: 500 }
  },
  'debt-free': {
    name: '🎉 Debt Freedom Journey',
    description: 'Someone who just paid off their last debt',
    debts: [
      {
        id: 'final-cc',
        name: 'Last Credit Card',
        balance: 127.43,
        apr: 19.99,
        minimumPayment: 35,
        type: 'credit_card'
      }
    ],
    settings: { 
      strategy: 'avalanche', 
      extraPayment: 300,
      achievements: ['first_payment', 'debt_under_1000', 'avalanche_warrior'],
      goals: [
        { type: 'debt_freedom', target: 0, current: 127.43, deadline: '2024-02-01' }
      ]
    }
  },
  'high-earner': {
    name: '💰 High Earner/High Debt',
    description: 'Professional with substantial income and debt',
    debts: [
      {
        id: 'cc-premium',
        name: 'Amex Platinum',
        balance: 15400,
        apr: 24.99,
        minimumPayment: 462,
        type: 'credit_card'
      },
      {
        id: 'business-loan',
        name: 'Business Line of Credit',
        balance: 45000,
        apr: 12.5,
        minimumPayment: 650,
        type: 'business'
      },
      {
        id: 'investment-loan',
        name: 'Investment Property',
        balance: 125000,
        apr: 7.25,
        minimumPayment: 875,
        type: 'investment'
      }
    ],
    settings: { 
      strategy: 'avalanche', 
      extraPayment: 2000,
      tier: 'pro',
      goals: [
        { type: 'custom_amount', target: 50000, current: 185400, deadline: '2025-12-31' }
      ]
    }
  }
};

const DebugShowcase = () => {
  const [currentProfile, setCurrentProfile] = useState('clean');
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debugData, setDebugData] = useState({});
  const { debts, addDebt, removeDebt, clearAllDebts } = useDebts();
  const { settings, updateSettings } = useSettings();

  // Load profile data
  const loadProfile = (profileKey) => {
    const profile = DEBUG_PROFILES[profileKey];
    
    // Clear existing data
    clearAllDebts();
    
    // Load new profile
    profile.debts.forEach(debt => {
      addDebt(debt);
    });
    
    if (profile.settings) {
      updateSettings(profile.settings);
    }
    
    setCurrentProfile(profileKey);
    console.log('🔄 Loaded profile:', profile.name);
  };

  // Debug data collection
  useEffect(() => {
    setDebugData({
      profileCount: Object.keys(DEBUG_PROFILES).length,
      currentDebts: debts.length,
      totalBalance: debts.reduce((sum, debt) => sum + debt.balance, 0),
      settings: settings,
      timestamp: new Date().toISOString()
    });
  }, [debts, settings, currentProfile]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Debug Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛠️ TrySnowball Debug Showcase
        </h1>
        <p className="text-gray-600">
          Complete feature testing environment with multiple debt profiles
        </p>
        
        {/* Debug Info */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Debug Info</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Profile:</span> {DEBUG_PROFILES[currentProfile].name}
            </div>
            <div>
              <span className="text-blue-600">Debts:</span> {debugData.currentDebts}
            </div>
            <div>
              <span className="text-blue-600">Total:</span> ${debugData.totalBalance?.toLocaleString() || '0'}
            </div>
            <div>
              <span className="text-blue-600">Strategy:</span> {settings.strategy || 'none'}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Selector */}
      <Card className="mb-8">
        <CardTitle>🎭 Test Profiles</CardTitle>
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
                {profile.debts.length} debts • ${profile.debts.reduce((sum, d) => sum + d.balance, 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CP-4 Multi-APR Debug */}
      {currentProfile === 'multi-apr-pro' && (
        <Card className="mb-8">
          <CardTitle>🎯 CP-4 Multi-APR Engine Debug</CardTitle>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Pro Feature Active</h4>
            <p className="text-yellow-700 text-sm mb-4">
              This profile demonstrates the CP-4 composite forecast engine with different APR buckets.
            </p>
            
            {debts.length > 0 && debts[0].buckets && (
              <div>
                <h5 className="font-medium mb-2">Bucket Breakdown:</h5>
                {debts[0].buckets.map(bucket => (
                  <div key={bucket.id} className="flex justify-between items-center py-1">
                    <span className="text-sm">{bucket.name}</span>
                    <span className="text-sm font-medium">
                      ${bucket.balance.toLocaleString()} @ {bucket.apr}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Core Debt Management */}
      <Card className="mb-8">
        <CardTitle>💳 Debt Management</CardTitle>
        <div className="mb-4">
          <Button onClick={() => setShowDebtForm(true)}>
            Add New Debt
          </Button>
        </div>
        
        {debts.length > 0 ? (
          <DebtTable 
            debts={debts}
            onEditDebt={(debt) => console.log('Edit debt:', debt)}
            onDeleteDebt={removeDebt}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            No debts loaded. Select a profile above or add a new debt.
          </div>
        )}
      </Card>

      {/* Forecast Components */}
      {debts.length > 0 && (
        <>
          <Card className="mb-8">
            <CardTitle>📊 Forecast & Strategy</CardTitle>
            <HeroForecast />
          </Card>

          <Card className="mb-8">
            <CardTitle>📈 Payment Strategy</CardTitle>
            <PaymentStrategyExplainer />
          </Card>
        </>
      )}

      {/* CP-5 Goals & Challenges */}
      <Card className="mb-8">
        <CardTitle>🎯 Goals & Challenges (CP-5)</CardTitle>
        <TeaserGoals />
      </Card>

      {/* Achievements */}
      <Card className="mb-8">
        <CardTitle>🏆 Achievements</CardTitle>
        <AchievementsChecklist />
      </Card>

      {/* AI Coach */}
      <Card className="mb-8">
        <CardTitle>🤖 AI Debt Coach</CardTitle>
        <div className="max-h-96 overflow-y-auto">
          <GPTCoachChat />
        </div>
      </Card>

      {/* Commitment Generator */}
      <Card className="mb-8">
        <CardTitle>📝 Commitment Generator</CardTitle>
        <CommitmentGenerator />
      </Card>

      {/* Share Card */}
      {debts.length > 0 && (
        <Card className="mb-8">
          <CardTitle>📱 Social Sharing</CardTitle>
          <ShareCard />
        </Card>
      )}

      {/* Debug Data Dump */}
      <Card className="mb-8">
        <CardTitle>🔍 Debug Data</CardTitle>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
          {JSON.stringify({
            currentProfile,
            debugData,
            debts: debts.map(d => ({ ...d, buckets: d.buckets || undefined })),
            settings
          }, null, 2)}
        </pre>
      </Card>

      {/* Modals */}
      {showDebtForm && (
        <DebtFormModal
          onClose={() => setShowDebtForm(false)}
          onSubmit={(debtData) => {
            addDebt({
              ...debtData,
              id: `debt-${Date.now()}`
            });
            setShowDebtForm(false);
          }}
        />
      )}
    </div>
  );
};

export default DebugShowcase;