import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BabySteps = () => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const toggleStep = (stepNumber) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepNumber)) {
      newCompleted.delete(stepNumber);
    } else {
      newCompleted.add(stepNumber);
    }
    setCompletedSteps(newCompleted);
  };

  const babySteps = [
    {
      number: 1,
      title: "Save £1,000 for Your Starter Emergency Fund",
      description: "This is your first step to financial freedom. Save £1,000 as quickly as possible to cover small emergencies without going into debt.",
      details: [
        "Sell items you don't need",
        "Work extra hours or a side job",
        "Use any bonuses or tax refunds",
        "Keep this money in a separate savings account"
      ],
      timeframe: "1-2 months",
      color: "bg-red-500"
    },
    {
      number: 2,
      title: "Pay Off All Debt (Except the House) Using the Debt Snowball",
      description: "List all debts except your mortgage from smallest to largest. Attack the smallest debt first while making minimum payments on the rest.",
      details: [
        "List debts from smallest to largest balance",
        "Pay minimums on all debts except the smallest",
        "Attack smallest debt with every extra penny",
        "When paid off, roll that payment to the next smallest debt"
      ],
      timeframe: "18 months - 2 years",
      color: "bg-orange-500",
      highlight: true
    },
    {
      number: 3,
      title: "Save 3-6 Months of Expenses in a Fully Funded Emergency Fund",
      description: "Now that you're debt-free, build a full emergency fund of 3-6 months of expenses. This protects you from life's bigger surprises.",
      details: [
        "Calculate 3-6 months of essential expenses",
        "Save this amount in a separate high-yield savings account",
        "Keep it easily accessible but separate from checking",
        "Only use for true emergencies"
      ],
      timeframe: "3-6 months",
      color: "bg-yellow-500"
    },
    {
      number: 4,
      title: "Invest 15% of Your Household Income in Retirement",
      description: "With no debt and a full emergency fund, invest 15% of your gross household income for retirement.",
      details: [
        "Use employer 401(k) match first",
        "Then Roth IRA up to the annual limit",
        "Then back to 401(k) or other retirement accounts",
        "Focus on growth stock mutual funds"
      ],
      timeframe: "Ongoing",
      color: "bg-green-500"
    },
    {
      number: 5,
      title: "Save for Your Children's College Fund",
      description: "If you have children, start saving for their college education using tax-advantaged accounts.",
      details: [
        "Use Education Savings Account (ESA) or 529 plan",
        "Don't sacrifice retirement for college savings",
        "Consider state tax benefits for 529 plans",
        "Teach kids about money and work ethic"
      ],
      timeframe: "Ongoing",
      color: "bg-blue-500"
    },
    {
      number: 6,
      title: "Pay Off Your Home Early",
      description: "With retirement and college savings on track, throw extra money at your mortgage to pay it off early.",
      details: [
        "Make extra principal payments",
        "Consider bi-weekly payments",
        "Use windfalls like bonuses or tax refunds",
        "Stay in your home long enough to benefit"
      ],
      timeframe: "10-15 years",
      color: "bg-indigo-500"
    },
    {
      number: 7,
      title: "Build Wealth and Give",
      description: "With no debt and a paid-for house, you can build wealth and give generously to others.",
      details: [
        "Invest in mutual funds and real estate",
        "Give generously to causes you care about",
        "Leave a legacy for your family",
        "Enjoy the freedom of financial peace"
      ],
      timeframe: "Ongoing",
      color: "bg-purple-500"
    }
  ];

  const currentStep = () => {
    for (let i = 0; i < babySteps.length; i++) {
      if (!completedSteps.has(i + 1)) {
        return i + 1;
      }
    }
    return 8; // All steps completed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Debt Foundations: 7 Essential Steps
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Build a solid foundation for lasting debt freedom
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              You're currently on Baby Step {currentStep()}
            </h3>
            <p className="text-blue-800">
              {currentStep() <= 7 ? 
                `Focus on: ${babySteps[currentStep() - 1].title}` : 
                "Congratulations! You've completed all 7 Baby Steps!"
              }
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {babySteps.map((step) => (
            <div 
              key={step.number}
              className={`bg-white rounded-lg shadow-sm border-l-4 ${
                step.highlight ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
              } transition-all duration-200 ${
                completedSteps.has(step.number) ? 'opacity-75' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`w-8 h-8 rounded-full ${step.color} text-white flex items-center justify-center font-bold text-sm mr-3`}>
                        {step.number}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {step.title}
                      </h3>
                      <div className="ml-auto flex items-center">
                        <button
                          onClick={() => toggleStep(step.number)}
                          className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            completedSteps.has(step.number) 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {completedSteps.has(step.number) && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {step.description}
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Action Steps:</h4>
                        <ul className="space-y-1">
                          {step.details.map((detail, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Typical Timeframe:</h4>
                        <p className="text-sm text-gray-600">{step.timeframe}</p>
                        
                        {step.number === 2 && (
                          <div className="mt-4">
                            <button
                              onClick={() => navigate('/debts')}
                              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                            >
                              Start Your Debt Snowball →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Money Helper Budget Tool */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📊 Before You Start: Get Your Budget Right
          </h3>
          <p className="text-blue-800 mb-4">
            Before diving into the Baby Steps, you need to know exactly where your money is going. 
            We recommend using the Money Helper Budget Planner to get a clear picture of your finances.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-blue-700">
              <strong>Why use the Money Helper tool instead of uploading your data here?</strong>
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>• Your financial data stays completely private</li>
              <li>• You maintain full control over your sensitive information</li>
              <li>• It's from Money Helper, the UK's free and impartial financial guidance service</li>
              <li>• More comprehensive budgeting features than we could build</li>
            </ul>
            <div className="mt-4">
              <a
                href="https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block font-medium"
              >
                Open Money Helper Budget Planner →
              </a>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BabySteps;