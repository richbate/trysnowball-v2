/**
 * How It Works Page
 * Step-by-step guide to using TrySnowball
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import DemoModeBanner from '../components/DemoModeBanner';
import { FileText, Brain, BarChart3, PartyPopper } from 'lucide-react';

const HowItWorks = () => {
  const { colors } = useTheme();

  const steps = [
    {
      number: "1",
      title: "Add Your Debts",
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      description: "List your debts with balance, rate, and minimum payment. That's all we need.",
      details: [
        "Enter each debt's current balance",
        "Add the interest rate (APR)",
        "Include minimum monthly payment",
        "No bank connections required"
      ]
    },
    {
      number: "2", 
      title: "Choose Your Strategy",
      icon: <Brain className="w-8 h-8 text-green-500" />,
      description: "Pick Snowball, Avalanche, or your own custom order. We simulate your plan instantly.",
      details: [
        "Snowball method for quick wins",
        "Avalanche method to save money",
        "Custom order for full control",
        "AI Coach helps you decide"
      ]
    },
    {
      number: "3",
      title: "Track and Adjust", 
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
      description: "Watch your debt shrink with real-time charts, projections, and AI coaching.",
      details: [
        "Visual progress charts",
        "Payoff date predictions", 
        "Interest savings calculations",
        "Update balances anytime"
      ]
    },
    {
      number: "4",
      title: "Celebrate Milestones",
      icon: <PartyPopper className="w-8 h-8 text-red-500" />,
      description: "When you pay off a debt, we make sure you notice. Share your wins or just enjoy the moment.",
      details: [
        "Debt payoff celebrations",
        "Progress milestone tracking",
        "Share cards for social media",
        "AI-generated encouragement"
      ]
    }
  ];

  return (
    <div className={`min-h-screen ${colors.background}`}>
      <DemoModeBanner />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className={`text-4xl font-bold ${colors.text.primary} mb-4`}>
            How TrySnowball Helps You Crush Your Debt
          </h1>
          <p className={`text-lg ${colors.text.secondary} max-w-2xl mx-auto`}>
            We help you build a custom debt payoff plan, track your progress, and stay motivated.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-12 mb-16">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-20 w-0.5 h-12 bg-gray-200 hidden md:block"></div>
              )}
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Step Icon and Number */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="bg-white border-2 border-gray-200 rounded-full w-16 h-16 flex items-center justify-center text-xl font-bold text-gray-900">
                    {step.number}
                  </div>
                  <div className="md:hidden">
                    {step.icon}
                  </div>
                </div>
                
                {/* Step Content */}
                <div className={`${colors.surface} rounded-lg shadow-sm border ${colors.border} p-6 flex-1`}>
                  <div className="flex items-start gap-4">
                    <div className="hidden md:block flex-shrink-0 mt-1">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <h2 className={`text-xl font-semibold ${colors.text.primary} mb-3`}>
                        📝 Step {step.number}: {step.title}
                      </h2>
                      <p className={`text-base ${colors.text.secondary} mb-4`}>
                        {step.description}
                      </p>
                      
                      {/* Step Details */}
                      <ul className="space-y-2">
                        {step.details.map((detail, idx) => (
                          <li key={idx} className={`flex items-start gap-3 text-sm ${colors.text.secondary}`}>
                            <span className="text-green-500 mt-1">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Philosophy */}
        <div className={`${colors.surface} rounded-lg p-8 ${colors.border} border text-center mb-12`}>
          <h3 className={`text-2xl font-semibold ${colors.text.primary} mb-4`}>
            No jargon. No judgment. Just progress.
          </h3>
          <p className={`text-lg ${colors.text.secondary} max-w-2xl mx-auto`}>
            TrySnowball is built for real people dealing with real debt. We focus on what actually works, 
            not complicated financial theory.
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className={`text-xl font-semibold ${colors.text.primary} mb-4`}>
            Ready to get started?
          </h3>
          <p className={`${colors.text.secondary} mb-6`}>
            Try our demo mode to see how it works, or join the beta for real debt tracking.
          </p>
          <div className="space-x-4">
            <Link
              to="/my-plan"
              className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-900 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Try Demo Mode
            </Link>
            <Link
              to="/waitlist"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;