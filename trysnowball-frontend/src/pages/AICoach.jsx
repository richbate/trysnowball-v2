import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataManager } from '../hooks/useDataManager';
import { useTheme } from '../contexts/ThemeContext';

const AICoach = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const {
    debts,
    totalDebt,
    totalMinPayments,
    extraPayment,
    projections
  } = useDataManager();

  const hasOnlyDemoData = debts.length === 0 || debts.every(debt => debt.isDemo);

  const categorizeDebtType = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('credit card') || lowerName.includes('card')) return 'Credit Card';
    if (lowerName.includes('loan')) return 'Personal Loan';
    if (lowerName.includes('mortgage')) return 'Mortgage';
    if (lowerName.includes('overdraft')) return 'Overdraft';
    if (lowerName.includes('finance')) return 'Finance';
    return 'Other';
  };

  const calculateDebtFreeDate = () => {
    if (!projections?.totalMonths) return 'Not calculated';
    const today = new Date();
    const futureDate = new Date(today.getFullYear(), today.getMonth() + projections.totalMonths, today.getDate());
    return futureDate.toISOString().split('T')[0];
  };

  const downloadForChatGPT = () => {
    if (debts.length === 0) {
      alert('Please add your debts first before downloading.');
      return;
    }

    const chatGPTData = {
      generated_date: new Date().toISOString().split('T')[0],
      total_debt: totalDebt,
      total_minimum_payments: totalMinPayments,
      number_of_debts: debts.length,
      debts: debts.map(debt => ({
        name: debt.name,
        balance: debt.amount,
        interest_rate: debt.interest,
        minimum_payment: debt.regularPayment,
        debt_type: categorizeDebtType(debt.name)
      })),
      snowball_order: [...debts].sort((a, b) => a.amount - b.amount).map((debt, index) => ({
        order: index + 1,
        name: debt.name,
        balance: debt.amount
      })),
      financial_summary: {
        estimated_payoff_months: projections?.totalMonths || 0,
        estimated_payoff_years: Math.floor((projections?.totalMonths || 0) / 12),
        current_extra_payment: extraPayment,
        debt_free_date: calculateDebtFreeDate()
      }
    };

    const dataStr = JSON.stringify(chatGPTData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `trysnowball-debts-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`min-h-screen ${colors.background} ${colors.text.primary} px-6 py-12`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-primary mb-4">AI Debt Coach</h1>
          <p className="text-xl mb-2 text-gray-600">Your Personal ChatGPT Debt Elimination Script</p>
          <p className="text-2xl font-bold text-primary mb-6">Get tough love coaching that actually works.</p>
        </header>

        {/* What You Get */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">What You Get</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-primary`}>
              <div className="text-3xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold mb-3">Personalized ChatGPT Script</h3>
              <p className="text-gray-600">A custom ChatGPT prompt designed specifically for UK debt situations. Input your data and get tailored advice.</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-primary`}>
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-3">Printable Worksheet</h3>
              <p className="text-gray-600">A comprehensive PDF worksheet to track your progress, set goals, and stay accountable to your debt-free journey.</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-primary`}>
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Direct App Integration</h3>
              <p className="text-gray-600">Load your personalized plan straight into TrySnowball. Seamless connection between coaching and tracking.</p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">Perfect For These Situations</h2>
          <div className="space-y-6">
            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-green-500`}>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">💳</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3 text-green-700">Maximise 0% Transfer Offers</h3>
                  <p className={`${colors.text.secondary} mb-4`}>
                    Got a 0% balance transfer offer? The AI Coach will help you calculate exactly how much to transfer, 
                    which debts to prioritize, and create a payment plan to clear everything before the promotional rate ends.
                  </p>
                  <div className="bg-green-50 rounded p-3">
                    <p className="text-sm text-green-800">
                      <strong>Example scenario:</strong> "I have a 0% transfer offer for 18 months. Should I transfer my £3,200 Barclaycard debt or focus on my overdraft first?"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-blue-500`}>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">🤖</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3 text-blue-700">Unsure How to Proceed? Let AI Crunch the Numbers</h3>
                  <p className={`${colors.text.secondary} mb-4`}>
                    Multiple debts, different interest rates, varying minimum payments? The AI Coach will analyze your specific situation 
                    and create multiple scenarios to show you the fastest, cheapest, and most motivating paths to debt freedom.
                  </p>
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Example scenario:</strong> "I have 5 different debts. Should I follow the snowball method or focus on the highest interest rate first?"
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${colors.surface} rounded-lg p-6 border-l-4 border-purple-500`}>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">⏰</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-3 text-purple-700">What Should I Do Now? Wait or Move</h3>
                  <p className={`${colors.text.secondary} mb-4`}>
                    Stuck in analysis paralysis? The AI Coach will give you a clear, actionable next step based on your current situation. 
                    No more wondering "what if" - get a definitive answer on what to do right now.
                  </p>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-sm text-purple-800">
                      <strong>Example scenario:</strong> "I just got a bonus of £1,500. Should I pay down debt, save it, or wait for a better transfer offer?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Purchase the AI Debt Coach</h3>
                <p className="text-gray-600">Get instant access to your personalized ChatGPT script, printable worksheet, and integration guide.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Download Your Debt Data</h3>
                <p className="text-gray-600">Export your debt information from TrySnowball in the exact format the AI Coach script expects.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Get Personalized Coaching</h3>
                <p className="text-gray-600">Use the script with ChatGPT to get tailored advice, motivation, and step-by-step guidance for your specific situation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">What Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <p className="text-gray-600 mb-4 italic">"The AI Coach gave me the kick up the backside I needed. It's like having a financial advisor who actually understands UK debt problems."</p>
              <p className="font-semibold">- Sarah M., Manchester</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <p className="text-gray-600 mb-4 italic">"Finally, a debt coach that doesn't sugarcoat things. The tough love approach worked where gentle encouragement failed."</p>
              <p className="font-semibold">- James T., London</p>
            </div>
          </div>
        </section>

        {/* Data Export Section */}
        {!hasOnlyDemoData && debts.length > 0 ? (
          <section className="mb-16">
            <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
              <h2 className="text-2xl font-bold mb-4 text-blue-900">Step 2: Download Your Debt Data</h2>
              <p className="text-blue-800 mb-6">
                Ready to get started? Download your debt data in the exact format the AI Coach script expects.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={downloadForChatGPT}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
                >
                  📥 Download My Debt Data
                </button>
                <a
                  href="https://stan.store/trysnowball/p/personal-ai-debt-coach"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg text-center"
                >
                  🛒 Get AI Coach - £2.99
                </a>
              </div>
              <div className="text-sm text-blue-700 bg-blue-100 rounded p-4">
                <p><strong>What you'll download:</strong> A structured JSON file with your debt information, payoff timeline, and snowball order - perfectly formatted for the ChatGPT AI Coach script.</p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <div className="bg-yellow-50 rounded-lg p-8 border border-yellow-200">
              <h2 className="text-2xl font-bold mb-4 text-yellow-900">Add Your Debts First</h2>
              <p className="text-yellow-800 mb-6">
                To use the AI Coach, you'll need to add your real debt information to TrySnowball first.
              </p>
              <button
                onClick={() => navigate('/debts')}
                className="bg-yellow-600 text-white px-8 py-4 rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-lg"
              >
                Add My Debts →
              </button>
            </div>
          </section>
        )}

        {/* Purchase Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-primary to-accent text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Serious About Debt Freedom?</h2>
            <p className="text-xl mb-8 opacity-90">
              Stop making excuses. Start making progress. Get the tough love coaching that actually works.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://stan.store/trysnowball/p/personal-ai-debt-coach"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-primary px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
              >
                🛒 Get AI Debt Coach - £2.99
              </a>
              {!hasOnlyDemoData && debts.length > 0 && (
                <button
                  onClick={downloadForChatGPT}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-primary transition-colors font-bold text-lg"
                >
                  📥 Download My Data
                </button>
              )}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <h3 className="text-xl font-semibold mb-3">What makes this different from free debt advice?</h3>
              <p className="text-gray-600">This isn't generic advice. It's a personalized AI coaching system that uses your actual debt data to provide specific, actionable guidance. Plus, it's designed specifically for UK debt situations - credit cards, Klarna, overdrafts, and all.</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <h3 className="text-xl font-semibold mb-3">Do I need a ChatGPT subscription?</h3>
              <p className="text-gray-600">The script works with both free and paid ChatGPT accounts. However, ChatGPT Plus gives you access to more advanced features and faster responses for a better coaching experience.</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <h3 className="text-xl font-semibold mb-3">Is my financial data secure?</h3>
              <p className="text-gray-600">Absolutely. Your data never leaves your device when you download it. You control what information you share with ChatGPT, and the script includes guidance on data privacy best practices.</p>
            </div>
            <div className={`${colors.surface} rounded-lg p-6 border border-gray-200`}>
              <h3 className="text-xl font-semibold mb-3">What if I don't like the tough love approach?</h3>
              <p className="text-gray-600">The script includes options to adjust the coaching style. You can make it more supportive or more direct based on what motivates you. The goal is results, not comfort.</p>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-accent transition-colors font-semibold"
          >
            ← Back to Home
          </button>
        </div>

        {/* Footer */}
        <footer className={`text-center mt-16 text-sm ${colors.text.muted}`}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-6">
              <button onClick={() => navigate('/library')} className="hover:text-primary transition-colors">
                Library
              </button>
              <button onClick={() => navigate('/debts')} className="hover:text-primary transition-colors">
                My Debts
              </button>
              <a 
                href="https://trysnowball.substack.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Newsletter
              </a>
              <button onClick={() => navigate('/baby-steps')} className="hover:text-primary transition-colors">
                Baby Steps
              </button>
              <a 
                href="https://stan.store/trysnowball/p/buy-me-a-coffee-figkm7db" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                ☕ Buy me a Coffee
              </a>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p>© {new Date().getFullYear()} TrySnowball. Built in the UK.</p>
              <p className="text-xs mt-2">
                Free debt management tools. Your data stays private. Built for UK financial situations.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AICoach;