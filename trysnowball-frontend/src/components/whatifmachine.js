import React, { useState, useEffect } from 'react';

const WhatIfMachine = () => {
  const [scenario, setScenario] = useState({
    totalDebt: 5000,
    currentPayment: 150,
    interestRate: 20,
    extraPayment: 0,
    bonusPayment: 0,
    frequency: 'monthly'
  });

  const [results, setResults] = useState({
    baseline: {},
    improved: {},
    savings: {}
  });

  // Calculate debt payoff scenario
  const calculatePayoff = (debt, monthlyPayment, annualRate) => {
    if (monthlyPayment <= 0) return { months: 0, totalInterest: 0, totalPaid: 0 };
    
    const monthlyRate = annualRate / 100 / 12;
    let balance = debt;
    let months = 0;
    let totalInterest = 0;
    
    while (balance > 0.01 && months < 600) { // Cap at 50 years
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(monthlyPayment - interestPayment, balance);
      
      if (principalPayment <= 0) break; // Payment too small
      
      balance -= principalPayment;
      totalInterest += interestPayment;
      months++;
    }
    
    return {
      months: months,
      years: Math.floor(months / 12),
      remainingMonths: months % 12,
      totalInterest: totalInterest,
      totalPaid: debt + totalInterest
    };
  };

  useEffect(() => {
    const baseline = calculatePayoff(scenario.totalDebt, scenario.currentPayment, scenario.interestRate);
    const improved = calculatePayoff(
      scenario.totalDebt, 
      scenario.currentPayment + scenario.extraPayment, 
      scenario.interestRate
    );
    
    const savings = {
      months: baseline.months - improved.months,
      years: Math.floor((baseline.months - improved.months) / 12),
      remainingMonths: (baseline.months - improved.months) % 12,
      interestSaved: baseline.totalInterest - improved.totalInterest,
      totalSaved: baseline.totalPaid - improved.totalPaid
    };

    setResults({ baseline, improved, savings });
  }, [scenario]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${remainingMonths} months`;
    if (remainingMonths === 0) return `${years} years`;
    return `${years} years, ${remainingMonths} months`;
  };

  const scenarios = [
    {
      title: "Skip Daily Coffee",
      description: "Save £3/day by making coffee at home",
      extraPayment: 90,
      icon: "☕"
    },
    {
      title: "Cancel 3 Subscriptions",
      description: "Netflix, Spotify, gym membership",
      extraPayment: 50,
      icon: "💳"
    },
    {
      title: "Side Hustle",
      description: "Freelance work or part-time job",
      extraPayment: 300,
      icon: "💼"
    },
    {
      title: "Eat Out Less",
      description: "Cook at home 4 nights a week",
      extraPayment: 120,
      icon: "🍽️"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🔮 What If Machine
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See exactly how small changes can dramatically speed up your debt payoff and save you thousands.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Your Current Situation
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Debt
                </label>
                <input
                  type="number"
                  value={scenario.totalDebt}
                  onChange={(e) => setScenario({...scenario, totalDebt: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Monthly Payment
                </label>
                <input
                  type="number"
                  value={scenario.currentPayment}
                  onChange={(e) => setScenario({...scenario, currentPayment: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  value={scenario.interestRate}
                  onChange={(e) => setScenario({...scenario, interestRate: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extra Monthly Payment
                </label>
                <input
                  type="number"
                  value={scenario.extraPayment}
                  onChange={(e) => setScenario({...scenario, extraPayment: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How much extra could you pay each month?
                </p>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            {/* Baseline Results */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Plan
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Payoff Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(results.baseline.months)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Interest</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(results.baseline.totalInterest)}
                  </p>
                </div>
              </div>
            </div>

            {/* Improved Results */}
            {scenario.extraPayment > 0 && (
              <div className="bg-green-50 rounded-lg shadow-sm p-6 border border-green-200">
                <h3 className="text-lg font-semibold text-green-900 mb-4">
                  With Extra £{scenario.extraPayment}/month
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-green-700">Payoff Time</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatTime(results.improved.months)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700">Total Interest</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(results.improved.totalInterest)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">You Save:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Time Saved</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatTime(results.savings.months)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Interest Saved</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(results.savings.interestSaved)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Scenarios */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Try These Common Scenarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarios.map((quickScenario, index) => (
              <button
                key={index}
                onClick={() => setScenario({...scenario, extraPayment: quickScenario.extraPayment})}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left"
              >
                <div className="text-2xl mb-2">{quickScenario.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {quickScenario.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {quickScenario.description}
                </p>
                <p className="text-sm font-medium text-blue-600">
                  +£{quickScenario.extraPayment}/month
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8 border border-blue-200"></div>