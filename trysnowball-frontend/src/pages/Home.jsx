import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const Home = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  return (
    <div className={`min-h-screen ${colors.background} ${colors.text.primary} px-6 py-12`}>
      <header className="text-center mb-16">
        <h1 className="text-5xl font-bold text-blue-500 mb-4">TrySnowball</h1>
        <p className={`text-xl mb-2 ${colors.text.secondary}`}>Debt is stealing your future.</p>
        <p className={`text-2xl font-bold ${colors.text.primary} mb-6`}>Take it back.</p>
        <a href="#signup" className="inline-block mt-4 px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
          Join the waitlist
        </a>
      </header>

      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-500">What is TrySnowball?</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-blue-500`}>
          <p className="text-lg leading-relaxed mb-4">
            TrySnowball <span className="text-blue-500 font-semibold">weaponizes</span> the proven debt snowball method to 
            <span className={`${colors.text.primary} font-bold`}> demolish your debt faster</span> than you thought possible.
          </p>
          <p className={`${colors.text.secondary} text-lg`}>
            <strong className={colors.text.primary}>Small debts first.</strong> 
            <strong className={colors.text.primary}> Momentum builds.</strong> 
            <strong className={colors.text.primary}> Freedom follows.</strong>
          </p>
        </div>
      </section>

      {/* Spend Analyser Section */}
      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-500">🔍 AI Spend Analyser</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-green-500`}>
          <p className="text-lg leading-relaxed mb-4">
            Upload your bank transactions and discover exactly where your money goes — and where you can save.
          </p>
          <div className={`${colors.surfaceSecondary} rounded-lg p-4 mb-4 ${colors.border} border`}>
            <div className="text-3xl font-bold text-green-500 mb-2">£215</div>
            <p className={`text-sm ${colors.text.muted}`}>Average monthly savings found</p>
          </div>
          <p className={`${colors.text.secondary} mb-6`}>
            Find hidden money for your debt snowball with AI-powered spending analysis. Your data stays private — everything happens in your browser.
          </p>
          <div className="space-y-3 sm:space-y-0 sm:space-x-4 sm:flex">
            <button
              onClick={() => navigate('/analyser')}
              className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow"
            >
              Analyse My Spending
            </button>
            <button
              onClick={() => navigate('/analyser')}
              className={`w-full sm:w-auto ${colors.surfaceSecondary} ${colors.text.secondary} px-6 py-3 rounded-lg font-semibold hover:${colors.surface} transition-colors`}
            >
              Try Demo Data
            </button>
          </div>
        </div>
      </section>

      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-500">The What If Machine</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-blue-500`}>
          <p className="text-lg leading-relaxed mb-4">
            What if you could <span className="text-blue-500 font-semibold">see your debt-free date</span>? 
            What if that daily coffee habit is <span className={`${colors.text.primary} font-semibold`}>costing you 6 months of freedom</span>? 
            What if an extra £50/month could <span className="text-blue-500 font-semibold">save you thousands</span>?
          </p>
          <p className={`text-lg font-bold ${colors.text.primary} mb-4`}>
            Stop wondering. Start seeing.
          </p>
          <p className={`${colors.text.secondary} mb-6`}>
            Our What If Machine shows you exactly how small changes create massive results—turning 
            <span className="text-blue-500 font-medium"> "what if"</span> into 
            <span className={`${colors.text.primary} font-medium`}> "when will I be free?"</span>
          </p>
          <button 
            onClick={() => navigate('/what-if')}
            className="text-blue-500 hover:text-blue-400 font-semibold text-lg"
          >
            See your way out →
          </button>
        </div>
      </section>

      <section className="mb-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-blue-500">Try the AI Coach</h2>
        <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-blue-500`}>
          <p className="text-lg leading-relaxed mb-4">
            Want a no-fluff plan to kill your debt? The <span className={`${colors.text.primary} font-semibold`}>TrySnowball AI Debt Coach</span> gives you a
            personalised ChatGPT script, a printable worksheet, and a plan you can load straight into the app.
          </p>
          <p className={`${colors.text.secondary} mb-6`}>
            Designed for real UK life — credit cards, Klarna, overdrafts, and all. It's tough love in digital form.
          </p>
          <a
            href="https://stan.store/trysnowball/p/personal-ai-debt-coach"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow"
          >
            🛒 Get the AI Coach – £2.99
          </a>
        </div>
      </section>

      <section id="signup" className={`${colors.surface} rounded-lg shadow-2xl p-8 my-16 max-w-md mx-auto ${colors.border} border`}>
        <h2 className={`text-2xl font-bold mb-6 text-center ${colors.text.primary}`}>Be the first to try it</h2>
        <form 
          name="signup" 
          method="POST" 
          data-netlify="true" 
          data-netlify-honeypot="bot-field"
          action="/#signup"
        >
          <input type="hidden" name="form-name" value="signup" />
          <p style={{display: 'none'}}>
            <input name="bot-field" />
          </p>
          
          <input
            type="email"
            name="email"
            placeholder="Your email"
            required
            className={`w-full p-3 ${colors.border} border rounded-lg mb-4 ${colors.surfaceSecondary} ${colors.text.primary} placeholder-gray-400 focus:border-blue-500 focus:outline-none`}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Join the waitlist
          </button>
        </form>
      </section>

      <footer className={`text-center mt-16 text-sm ${colors.text.muted}`}>
        <p>© {new Date().getFullYear()} TrySnowball. Built in the UK.</p>
      </footer>
    </div>
  );
};

export default Home;