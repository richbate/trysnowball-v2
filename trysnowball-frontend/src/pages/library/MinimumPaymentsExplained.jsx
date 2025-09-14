import React from 'react';
import { Link } from 'react-router-dom';

const MinimumPaymentsExplained = () => {

 return (
  <div className={`max-w-4xl mx-auto px-4 py-8 ${colors.background}`}>
   <div className={`${colors.surface} rounded-lg shadow-sm border ${colors.border} p-8`}>
    <div className="mb-6">
     <h1 className={`text-4xl font-bold mb-4 ${colors.text.primary}`}>
      Why Minimum Payments Matter: Avoiding the Interest Trap
     </h1>
     <p className={`text-lg ${colors.text.secondary} leading-relaxed`}>
      When your minimum payment is less than monthly interest, your debt grows every month—even if you're paying. 
      Here's how to spot the problem and fix it.
     </p>
    </div>

    <div className="space-y-8">
     <section>
      <h2 className={`text-2xl font-semibold mb-4 ${colors.text.primary}`}>The Hidden Debt Trap</h2>
      <div className="space-y-4">
       <p className={`${colors.text.secondary} leading-relaxed`}>
        Many people don't realize their minimum payments aren't covering monthly interest charges. This creates 
        "negative amortization"—your balance grows despite making payments. It's more common than you think, 
        especially with high-interest credit cards and store cards.
       </p>
       
       <div className={`${colors.surfaceSecondary} p-6 rounded-lg border-l-4 border-red-500`}>
        <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Real UK Example</h3>
        <ul className={`space-y-2 ${colors.text.secondary}`}>
         <li>• Credit card balance: £5,000</li>
         <li>• Interest rate: 23.9% APR</li>
         <li>• Monthly interest: £99.58</li>
         <li>• Minimum payment: £50</li>
         <li>• <strong>Result: Balance grows by £49.58 each month</strong></li>
        </ul>
        <p className={`mt-3 text-sm ${colors.text.muted}`}>
         After 12 months of £50 payments, you'd owe £5,595—£595 more than when you started.
        </p>
       </div>
      </div>
     </section>

     <section>
      <h2 className={`text-2xl font-semibold mb-4 ${colors.text.primary}`}>How to Calculate Monthly Interest</h2>
      <div className="space-y-4">
       <p className={`${colors.text.secondary} leading-relaxed`}>
        Understanding your monthly interest helps you set realistic minimum payments:
       </p>
       
       <div className={`${colors.surface} border ${colors.border} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Quick Calculation</h3>
        <div className={`space-y-3 ${colors.text.secondary}`}>
         <p><strong>Monthly Interest = Balance × (APR ÷ 12)</strong></p>
         <div className="bg-gray-50 p-4 rounded font-mono text-sm">
          £5,000 × (23.9% ÷ 12) = £5,000 × 1.99% = £99.58
         </div>
         <p className="text-sm">
          Your minimum payment should be at least this amount, plus a bit extra to reduce the balance.
         </p>
        </div>
       </div>
      </div>
     </section>

     <section>
      <h2 className={`text-2xl font-semibent mb-4 ${colors.text.primary}`}>Warning Signs to Watch For</h2>
      <div className={`${colors.surfaceSecondary} p-6 rounded-lg`}>
       <ul className={`space-y-3 ${colors.text.secondary}`}>
        <li>• Your balance stays the same or grows despite payments</li>
        <li>• Minimum payment is less than 2% of your balance</li>
        <li>• Most of your payment goes to "interest" on statements</li>
        <li>• You're making progress on some debts but not others</li>
        <li>• TrySnowball shows "Min below interest" warnings</li>
       </ul>
      </div>
     </section>

     <section>
      <h2 className={`text-2xl font-semibold mb-4 ${colors.text.primary}`}>How to Fix Insufficient Minimums</h2>
      <div className="space-y-6">
       <div className={`${colors.surface} border ${colors.border} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Option 1: Increase Minimum Payments</h3>
        <p className={`${colors.text.secondary} mb-3`}>
         Contact your lender to increase your minimum payment. Most credit card companies allow this online or by phone.
        </p>
        <div className="bg-green-50 p-4 rounded">
         <p className="text-green-800 text-sm">
          <strong>Pro tip:</strong> Set your minimum to interest + £10-20 to guarantee progress every month.
         </p>
        </div>
       </div>

       <div className={`${colors.surface} border ${colors.border} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Option 2: Add Snowball Budget</h3>
        <p className={`${colors.text.secondary} mb-3`}>
         Use TrySnowball's extra payment system to add money on top of minimums. The Snowball or Avalanche 
         strategy will automatically allocate extra funds to problematic debts.
        </p>
       </div>

       <div className={`${colors.surface} border ${colors.border} rounded-lg p-6`}>
        <h3 className={`text-lg font-semibold mb-3 ${colors.text.primary}`}>Option 3: Balance Transfer or Consolidation</h3>
        <p className={`${colors.text.secondary}`}>
         Move high-interest debt to a 0% balance transfer card or lower-rate personal loan. This reduces 
         monthly interest, making your existing payments more effective.
        </p>
       </div>
      </div>
     </section>

     <section>
      <h2 className={`text-2xl font-semibold mb-4 ${colors.text.primary}`}>Take Action Today</h2>
      <div className="space-y-4">
       <p className={`${colors.text.secondary} leading-relaxed`}>
        Don't let insufficient minimum payments derail your debt payoff. Review your statements, calculate 
        your monthly interest, and adjust your payments accordingly.
       </p>
       
       <div className="flex space-x-4">
        <Link 
         to="/plan" 
         className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
         Check Your Plan
        </Link>
        <Link 
         to="/library/debt-snowball-plan" 
         className={`inline-flex items-center px-6 py-3 border ${colors.border} ${colors.text.secondary} font-medium rounded-lg hover:bg-gray-50 transition-colors`}
        >
         Learn About Snowball Strategy
        </Link>
       </div>
      </div>
     </section>
    </div>
   </div>
  </div>
 );
};

export default MinimumPaymentsExplained;