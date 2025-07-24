import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useDataManager } from '../hooks/useDataManager';

const MoneyMakeover = () => {
  const { colors } = useTheme();
  const { debts } = useDataManager();
  const [hasDebts, setHasDebts] = useState(false);
  const [smallestDebts, setSmallestDebts] = useState([]);

  useEffect(() => {
    if (debts && debts.length > 0) {
      setHasDebts(true);
      
      // Find smallest 1-2 debts (under £500)
      const smallDebts = debts
        .filter(debt => debt.amount <= 500)
        .sort((a, b) => a.amount - b.amount)
        .slice(0, 2);
      
      setSmallestDebts(smallDebts);
    }
  }, [debts]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const PersonalisedSection = () => {
    if (!hasDebts || smallestDebts.length === 0) return null;

    return (
      <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-green-500 mb-8`}>
        <h3 className="text-xl font-bold mb-4 text-green-600">Your Quick Win Opportunity</h3>
        <p className="mb-4">Based on your debt list, here are your best candidates for a 30-day payoff:</p>
        
        <div className="space-y-4">
          {smallestDebts.map((debt, index) => {
            const monthlyPayment = Math.ceil(debt.amount / 1); // 1 month payoff
            return (
              <div key={debt.id} className={`${colors.surfaceSecondary} rounded-lg p-4 border ${colors.border}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{debt.name}</h4>
                    <p className="text-sm text-gray-600">{debt.creditorType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(debt.amount)}</p>
                    <p className="text-sm text-gray-600">Clear in 1 month with {formatCurrency(monthlyPayment)}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded text-sm">
                  <p className="font-semibold text-green-800">Your plan:</p>
                  <p className="text-green-700">
                    Find an extra {formatCurrency(monthlyPayment)} this month to clear this debt completely. 
                    That's about {formatCurrency(Math.ceil(monthlyPayment / 30))} per day.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${colors.background} ${colors.text.primary} px-6 py-12`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">1-Month Money Makeover</h1>
          <p className="text-xl leading-relaxed mb-4">
            Clear your smallest debts in 30 days and prove you can do this
          </p>
          <p className="text-lg text-gray-600">
            Small debts clutter your mind, your cash flow and give a false sense of security. Let's clear 1–2 of them for a quick confidence boost.
          </p>
        </header>

        {/* Personalised Section */}
        {hasDebts && smallestDebts.length > 0 && <PersonalisedSection />}

        {/* Main Instruction Section */}
        <section className={`${colors.surface} rounded-lg p-8 mb-8`}>
          <h2 className="text-2xl font-bold mb-6">The Challenge</h2>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Spot Your Quick Wins</h3>
                <p className="text-gray-600 mb-3">
                  Look for debts under £500 — store cards, small loans, overdrafts. These are perfect for a 30-day sprint.
                </p>
                {!hasDebts && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="text-blue-700">
                      💡 <strong>Haven't added your debts yet?</strong> Use tools like Snoop or your banking app to get a complete picture first.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Make Your Commitment</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="font-semibold text-yellow-800 text-lg italic">
                    "I'll clear the smallest debt in my life this month — and prove I can do this."
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Find the Money</h3>
                <p className="text-gray-600 mb-3">
                  You don't need new income — just redirect what you're already spending:
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Pause your savings/rounding pots for 30 days</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Try being sober for a month</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Shop at a different supermarket, make a food plan</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Cut discretionary spending (shopping, eating out)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Cancel low-value subscriptions you forgot about</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Sell something you don't need</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Funding Strategy */}
        <section className={`${colors.surface} rounded-lg p-8 mb-8`}>
          <h2 className="text-2xl font-bold mb-6">Where to Find the Money</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`${colors.surfaceSecondary} rounded-lg p-6`}>
              <h3 className="font-semibold text-lg mb-4 text-orange-600">Redirect Existing Money</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span>Savings apps (Monzo, Starling pots)</span>
                  <span className="font-semibold">£20-80/month</span>
                </li>
                <li className="flex justify-between">
                  <span>Unused gym membership</span>
                  <span className="font-semibold">£25-50/month</span>
                </li>
                <li className="flex justify-between">
                  <span>Streaming services (keep 1, pause others)</span>
                  <span className="font-semibold">£30-60/month</span>
                </li>
                <li className="flex justify-between">
                  <span>Coffee shop visits</span>
                  <span className="font-semibold">£40-100/month</span>
                </li>
              </ul>
            </div>
            
            <div className={`${colors.surfaceSecondary} rounded-lg p-6`}>
              <h3 className="font-semibold text-lg mb-4 text-blue-600">Generate Quick Cash</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span>Sell unused tech (old phone, tablet)</span>
                  <span className="font-semibold">£50-300</span>
                </li>
                <li className="flex justify-between">
                  <span>Facebook Marketplace (clothes, books)</span>
                  <span className="font-semibold">£30-150</span>
                </li>
                <li className="flex justify-between">
                  <span>Cashback from switching (utilities)</span>
                  <span className="font-semibold">£25-200</span>
                </li>
                <li className="flex justify-between">
                  <span>Freelance/gig work (1-2 weekends)</span>
                  <span className="font-semibold">£100-400</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800 font-semibold">
              Even £50–£100 redirected this month can be the start of your momentum.
            </p>
          </div>
        </section>

        {/* Emotional Benefits */}
        <section className={`${colors.surface} rounded-lg p-8 mb-8`}>
          <h2 className="text-2xl font-bold mb-6">Why This Works</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold">Builds Real Confidence</h3>
                <p className="text-gray-600">Proving you can clear a debt completely changes your mindset from "I can't" to "I can do this."</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="text-2xl">🧠</div>
              <div>
                <h3 className="font-semibold">Clears Mental Space</h3>
                <p className="text-gray-600">Small debts create disproportionate mental clutter. Clearing them gives you breathing room to focus on bigger goals.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="text-2xl">💪</div>
              <div>
                <h3 className="font-semibold">Creates Momentum</h3>
                <p className="text-gray-600">Success breeds success. One cleared debt makes the next one feel more achievable.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="text-2xl">💰</div>
              <div>
                <h3 className="font-semibold">Improves Cash Flow</h3>
                <p className="text-gray-600">Every cleared debt frees up its minimum payment for the next debt — that's the snowball effect.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className={`${colors.surface} rounded-lg p-8 border-l-4 border-primary`}>
          <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-600 mb-6">
            Pick your smallest debt and commit to clearing it this month. You've got this.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {!hasDebts && (
              <a 
                href="/debts" 
                className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors text-center"
              >
                Add Your Debts First
              </a>
            )}
            
            <a 
              href="/ai-coach" 
              className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary hover:text-white transition-colors text-center"
            >
              Get AI Coaching Support
            </a>
            
            <a 
              href="/baby-steps" 
              className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
            >
              See the Full Plan
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default MoneyMakeover;