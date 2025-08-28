import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target, TrendingUp, Clock, PoundSterling } from 'lucide-react';
import { formatCurrency } from '../utils/debtFormatting';

const PaymentStrategyExplainer = ({ simulationResults, userExtraPayment = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!simulationResults || !simulationResults.summary) {
    return null;
  }

  const { summary, monthlyBreakdowns } = simulationResults;
  const baseMinPayments = monthlyBreakdowns[0]?.budget?.baseMinPayments || 0;
  
  // Calculate some key insights
  const finalMonth = monthlyBreakdowns[monthlyBreakdowns.length - 1];
  const finalSnowballSize = finalMonth?.budget?.snowballFromCleared || 0;
  const snowballMultiplier = userExtraPayment > 0 ? (finalSnowballSize + userExtraPayment) / userExtraPayment : 0;

  const keyStats = [
    {
      icon: Clock,
      label: 'Debt-Free Timeline',
      value: `${summary.totalMonths} months`,
      subtext: summary.monthsSaved > 0 ? `${summary.monthsSaved} months faster` : 'Minimum payments only',
      color: 'text-blue-600'
    },
    {
      icon: PoundSterling,
      label: 'Interest Saved',
      value: formatCurrency(summary.interestSaved || 0),
      subtext: `vs minimum payments only`,
      color: 'text-green-600'
    },
    {
      icon: TrendingUp,
      label: 'Final Snowball Size',
      value: formatCurrency(finalSnowballSize),
      subtext: userExtraPayment > 0 ? `${snowballMultiplier.toFixed(1)}x your extra payment` : 'No extra payment',
      color: 'text-purple-600'
    }
  ];

  const PaymentBreakdownSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-slate-50 p-4 rounded-lg border">
        <div className="text-sm text-slate-600 mb-1">Base Minimum Payments</div>
        <div className="text-2xl font-bold text-slate-900">{formatCurrency(baseMinPayments)}</div>
        <div className="text-xs text-slate-500">Required by lenders</div>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-600 mb-1">Your Extra Payment</div>
        <div className="text-2xl font-bold text-blue-700">{formatCurrency(userExtraPayment)}</div>
        <div className="text-xs text-blue-500">Consistent monthly commitment</div>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <div className="text-sm text-purple-600 mb-1">💥 Final Snowball Power</div>
        <div className="text-2xl font-bold text-purple-700">{formatCurrency(userExtraPayment + finalSnowballSize)}</div>
        <div className="text-xs text-purple-500">Total force applied to final debt</div>
      </div>
    </div>
  );

  const SnowballExplanation = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          How the Snowball Method Works
        </h4>
        <div className="space-y-3 text-sm text-green-700">
          <div className="flex items-start space-x-3">
            <div className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-medium">Pay minimums on all debts</div>
              <div className="text-green-600">Keeps you in good standing with all lenders</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-medium">Attack smallest debt with extra payments</div>
              <div className="text-green-600">Creates quick wins and builds momentum</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-medium">Roll cleared debt's minimum into the snowball</div>
              <div className="text-green-600">Your extra payment grows automatically</div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="bg-green-200 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <div className="font-medium">Repeat until debt-free</div>
              <div className="text-green-600">Each cleared debt makes the next one faster</div>
            </div>
          </div>
        </div>
      </div>

      {userExtraPayment > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Your Snowball Journey</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <p>You're starting with <span className="font-semibold">£{userExtraPayment}</span> extra per month.</p>
            <p>Your <span className="font-semibold text-purple-700">💥 snowball power</span> will grow to <span className="font-semibold">{formatCurrency(userExtraPayment + finalSnowballSize)}</span> - 
            that's <span className="font-semibold">{snowballMultiplier.toFixed(1)}x</span> your original commitment!</p>
            <p className="text-blue-600">This growing force is what crushes your debts faster each month.</p>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h4 className="text-lg font-semibold text-yellow-800 mb-3">💡 Pro Tips</h4>
        <div className="text-sm text-yellow-700 space-y-2">
          <p>• <strong>Start small:</strong> Even £25 extra per month makes a difference</p>
          <p>• <strong>Stay consistent:</strong> Regular payments build unstoppable momentum</p>
          <p>• <strong>Celebrate wins:</strong> Each cleared debt is a major victory</p>
          <p>• <strong>Don't create new debt:</strong> Keep those credit cards clear</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-slate-900">💪 Your Debt Freedom Strategy</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          {isExpanded ? (
            <>Hide Details <ChevronUp className="h-4 w-4 ml-1" /></>
          ) : (
            <>Show Details <ChevronDown className="h-4 w-4 ml-1" /></>
          )}
        </button>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {keyStats.map((stat, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={`${stat.color} bg-opacity-10 rounded-lg p-3`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-sm text-slate-600">{stat.label}</div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {isExpanded && (
        <div className="space-y-6">
          <PaymentBreakdownSummary />
          <SnowballExplanation />
        </div>
      )}

      {!isExpanded && userExtraPayment > 0 && (
        <div className="bg-gradient-to-r from-green-100 to-purple-100 p-4 rounded-lg">
          <p className="text-center text-slate-700">
            Your {formatCurrency(userExtraPayment)} monthly extra grows to <span className="font-semibold text-purple-700">💥 {formatCurrency(userExtraPayment + finalSnowballSize)} snowball power</span> by the end. 
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-700 font-medium ml-1 underline"
            >
              See how it works →
            </button>
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentStrategyExplainer;