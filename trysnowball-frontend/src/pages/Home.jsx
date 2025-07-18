import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useUserFlow } from '../contexts/UserFlowContext';

const Home = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { startDemo } = useUserFlow();

  const handleTryDemo = () => {
    startDemo();
    navigate('/debts');
  };

  return (
    <div className={`min-h-screen ${colors.background} ${colors.text.primary} px-6 py-12`}>
      <header className="text-center mb-16 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-primary mb-4">TrySnowball</h1>
        <p className="text-lg leading-relaxed mb-4 font-semibold">
          Pay off debt faster, with less guesswork.
        </p>
        <p className="text-lg leading-relaxed mb-6">
          TrySnowball helps you see your debt clearly, change your habits, and find hidden money to throw at it.
        </p>
        <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center mb-8">
          <button
            onClick={handleTryDemo}
            className="w-full sm:w-auto bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-accent transition-colors shadow-lg"
          >
            Try Demo
          </button>
        </div>
      </header>

      <section className="mb-16 max-w-4xl mx-auto">
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-primary`}>
          
          <div className={`${colors.surfaceSecondary} rounded-lg p-6 mb-6 ${colors.border} border`}>
            <h3 className={`text-xl font-bold mb-4 ${colors.text.primary}`}>The Debt Snowball Method (hat tip to Dave Ramsey)</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold mb-1">List your debts, smallest to largest</p>
                  <p className="text-sm text-gray-600">Ignore interest rates — focus on balance amounts only</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold mb-1">Pay minimums on everything</p>
                  <p className="text-sm text-gray-600">Keep all accounts current and in good standing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold mb-1">Attack the smallest debt with everything extra</p>
                  <p className="text-sm text-gray-600">Every spare pound goes to the smallest balance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <p className="font-semibold mb-1">Roll payments forward</p>
                  <p className="text-sm text-gray-600">When one's paid off, add that payment to the next smallest debt</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">5</div>
                <div>
                  <p className="font-semibold mb-1">Repeat until debt-free</p>
                  <p className="text-sm text-gray-600">The snowball gets bigger with each debt you eliminate</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className={`${colors.text.secondary} text-lg`}>
            <strong className={colors.text.primary}>Why it works:</strong> Quick wins build momentum. 
            Psychology beats mathematics when it comes to changing behavior.
            <br />
            <strong className={colors.text.primary}>Start small, build momentum, get free.</strong>
          </p>
        </div>
      </section>

      {/* Dave Ramsey Baby Steps Section */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-primary">🏗️ Dave Ramsey's Baby Steps</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-primary`}>
          <p className="text-lg leading-relaxed mb-4 font-semibold">
            The debt snowball is just one step in a proven plan to financial freedom
          </p>
          <p className="text-lg leading-relaxed mb-6">
            Dave Ramsey's 7 Baby Steps have helped millions escape debt and build wealth. 
            The debt snowball method is Baby Step 2 — but it works best as part of the complete system.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={`${colors.surfaceSecondary} rounded-lg p-4`}>
              <div className="flex items-center mb-2">
                <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">1</div>
                <h4 className="font-semibold">Emergency Fund</h4>
              </div>
              <p className="text-sm text-gray-600">Save £1,000 for starter emergency fund</p>
            </div>
            
            <div className={`${colors.surfaceSecondary} rounded-lg p-4 border-2 border-primary`}>
              <div className="flex items-center mb-2">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">2</div>
                <h4 className="font-semibold">Debt Snowball</h4>
              </div>
              <p className="text-sm text-gray-600">Pay off all debt (except house) using snowball method</p>
              <p className="text-xs text-primary font-semibold mt-1">← You are here!</p>
            </div>
            
            <div className={`${colors.surfaceSecondary} rounded-lg p-4`}>
              <div className="flex items-center mb-2">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-3">3</div>
                <h4 className="font-semibold">Full Emergency Fund</h4>
              </div>
              <p className="text-sm text-gray-600">Save 3-6 months of expenses</p>
            </div>
          </div>
          
          <p className={`${colors.text.secondary} mb-6`}>
            <strong className={colors.text.primary}>Plus 4 more steps:</strong> Investing for retirement, children's college, 
            paying off your home early, and building wealth to give generously.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate('/baby-steps')}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors shadow"
            >
              → See All 7 Baby Steps
            </button>
            <a
              href="https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-transparent border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors shadow text-center"
            >
              → Start Your Budget (Money Helper)
            </a>
          </div>
        </div>
      </section>

      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-primary">🔮 The What If Machine</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-primary`}>
          <p className="text-lg leading-relaxed mb-4 font-semibold">
            Want to see your debt-free date?
          </p>
          <p className="text-lg leading-relaxed mb-4">
            What if you ditched that daily coffee? Paid £50 extra a month?
            <br />
            What if you could see the impact instantly?
          </p>
          <p className={`text-lg font-bold ${colors.text.primary} mb-4`}>
            Stop guessing. Start seeing.
          </p>
          <p className={`${colors.text.secondary} mb-6`}>
            Our What If Machine shows how small changes create big results.
          </p>
          <button 
            onClick={() => navigate('/what-if')}
            className="text-primary hover:text-accent font-semibold text-lg"
          >
            → See Your Way Out
          </button>
        </div>
      </section>

      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-primary">💡 AI Debt Coach</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-primary`}>
          <p className="text-lg leading-relaxed mb-4 font-semibold">
            Need a no-BS plan?
          </p>
          <p className="text-lg leading-relaxed mb-4">
            Get a personalised ChatGPT script, a printable worksheet, and a plan ready to load into TrySnowball.
          </p>
          <p className={`${colors.text.secondary} mb-6`}>
            Made for real UK life — credit cards, Klarna, overdrafts and all.
          </p>
          <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex">
            <button
              onClick={() => navigate('/ai-coach')}
              className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors shadow"
            >
              → Learn More About AI Coach
            </button>
            <a
              href="https://stan.store/trysnowball/p/personal-ai-debt-coach"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-block px-6 py-3 bg-transparent border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors shadow text-center"
            >
              → 🛒 Get the AI Coach – £2.99
            </a>
          </div>
        </div>
      </section>


      {/* Purpose Statement */}
      <section className={`${colors.surface} rounded-lg shadow-sm p-8 my-16 max-w-4xl mx-auto ${colors.border} border`}>
        <div className="text-center">
          <p className={`text-lg mb-4 ${colors.text.secondary}`}>
            TrySnowball exists for one reason:
          </p>
          <p className={`text-2xl font-bold mb-4 ${colors.text.primary}`}>
            To help you get out of debt, faster, without shame or gimmicks.
          </p>
          <p className={`text-lg ${colors.text.secondary}`}>
            Because you deserve better than minimum payments.
          </p>
        </div>
      </section>

      <footer className={`text-center mt-16 text-sm ${colors.text.muted}`}>
        <div className="space-y-4">
          <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => navigate('/library')} className="hover:text-primary transition-colors">
              Library
            </button>
            <button onClick={() => navigate('/ai-coach')} className="hover:text-primary transition-colors">
              AI Coach
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
  );
};

export default Home;