import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';

// Dynamic headlines for A/B testing
const headlines = [
  { id: 'crush_freedom', text: 'Crush your debt, build your freedom' },
  { id: 'one_plan', text: 'One smart plan to clear every card' },
  { id: 'goodbye_stress', text: 'Say goodbye to debt stress, forever' },
  { id: 'red_ready', text: 'From red to ready: take control today' },
  { id: 'smarter_faster', text: 'Smarter payments, faster freedom' },
  { id: 'path_clear', text: 'Your path out of debt, finally clear' },
  { id: 'small_wins', text: 'Small steps. Big wins. Zero debt.' },
  { id: 'clear_balances', text: 'Clear balances, not your bank account' },
  { id: 'chaos_plan', text: 'Turn chaos into a clear payoff plan' },
  { id: 'sooner_think', text: 'Debt free sooner than you think' }
];

// Dynamic button text for A/B testing
const buttonTexts = [
  { id: 'start_beta', text: 'Start Your Beta Access' },
  { id: 'join_waitlist', text: 'Join the Waitlist' },
  { id: 'get_early_access', text: 'Get Early Access' },
  { id: 'reserve_spot', text: 'Reserve My Spot' },
  { id: 'notify_launch', text: 'Notify Me at Launch' },
  { id: 'claim_access', text: 'Claim Your Access' },
  { id: 'secure_place', text: 'Secure My Place' },
  { id: 'early_access', text: 'Get Early Access' }
];

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [currentHeadline, setCurrentHeadline] = useState<{ id: string; text: string } | null>(null);
  const [currentButtonText, setCurrentButtonText] = useState<{ id: string; text: string } | null>(null);

  // Select and track headline and button text on component mount
  useEffect(() => {
    // Check if we already have variations for this session
    const storedHeadline = sessionStorage.getItem('currentHeadline');
    const storedButtonText = sessionStorage.getItem('currentButtonText');

    if (storedHeadline && storedButtonText) {
      // Use existing variations from session
      setCurrentHeadline(JSON.parse(storedHeadline));
      setCurrentButtonText(JSON.parse(storedButtonText));
    } else {
      // Select random headline and button text, store in session
      const selectedHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      const selectedButtonText = buttonTexts[Math.floor(Math.random() * buttonTexts.length)];

      setCurrentHeadline(selectedHeadline);
      setCurrentButtonText(selectedButtonText);

      sessionStorage.setItem('currentHeadline', JSON.stringify(selectedHeadline));
      sessionStorage.setItem('currentButtonText', JSON.stringify(selectedButtonText));

      // Track headline and button text view in PostHog
      if (typeof posthog !== 'undefined') {
        posthog.capture('ab_test_variations_viewed', {
          headline_id: selectedHeadline.id,
          headline_text: selectedHeadline.text,
          button_text_id: selectedButtonText.id,
          button_text: selectedButtonText.text,
          timestamp: new Date().toISOString()
        });
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic email validation
    if (!email || !email.includes('@') || email.length < 5) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'maintenance_page',
          headline_id: currentHeadline?.id,
          headline_text: currentHeadline?.text,
          button_text_id: currentButtonText?.id,
          button_text: currentButtonText?.text
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || "Thanks! We'll notify you when we launch.");

        // Track successful signup with PostHog
        posthog.capture('maintenance_email_signup', {
          email_domain: email.split('@')[1],
          source: 'maintenance_page',
          headline_id: currentHeadline?.id,
          headline_text: currentHeadline?.text,
          button_text_id: currentButtonText?.id,
          button_text: currentButtonText?.text,
          conversion_source: 'ab_test_variations',
          timestamp: new Date().toISOString()
        });

        // Clear email field
        setEmail('');
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again.');

      // Track error
      posthog.capture('maintenance_email_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex flex-col items-center justify-center px-4 text-white">
      <div className="max-w-2xl text-center">
        {/* Logo/Brand */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4">TrySnowball</h1>
        </div>

        {/* Main Heading */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {currentHeadline?.text || 'Debt freedom, one snowball at a time'}
          </h2>

          <p className="text-xl text-purple-100 mb-12">
            A simple UK debt payoff planner that keeps you motivated.
          </p>

          {/* Email Capture Form */}
          {status !== 'success' ? (
            <div>
              <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 text-gray-900 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 text-base"
                    disabled={status === 'loading'}
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-md hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base whitespace-nowrap"
                  >
                    {status === 'loading' ? 'Joining...' : (currentButtonText?.text || 'Start Your Beta Access')}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="mt-4 text-red-200 text-sm">{message}</p>
                )}
              </form>

              <p className="text-purple-200 text-sm mb-6">
                🏠 Built for UK households • No ads • Cancel anytime
              </p>

              {/* Try Demo Button */}
              <div className="mt-8 pt-8 border-t border-purple-400/30">
                <p className="text-purple-200 text-sm mb-4">Want to see how it works first?</p>
                <button
                  onClick={() => {
                    // Track demo button click
                    posthog.capture('demo_button_clicked', {
                      source: 'maintenance_page',
                      headline_id: currentHeadline?.id,
                      button_text_id: currentButtonText?.id,
                      timestamp: new Date().toISOString()
                    });
                    navigate('/app');
                  }}
                  className="px-6 py-3 bg-transparent border-2 border-purple-300 text-purple-100 font-semibold rounded-md hover:bg-purple-300/10 hover:border-purple-200 transition-all duration-200"
                >
                  🎭 Try Demo with Sample Data
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-xl mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-100 font-semibold text-lg mb-8">{message}</p>

              {/* Try Demo Button for Success State */}
              <div className="mt-6 pt-6 border-t border-green-400/30">
                <p className="text-green-200 text-sm mb-4">While you wait, explore with demo data:</p>
                <button
                  onClick={() => {
                    posthog.capture('demo_button_clicked', {
                      source: 'maintenance_page_success',
                      headline_id: currentHeadline?.id,
                      button_text_id: currentButtonText?.id,
                      timestamp: new Date().toISOString()
                    });
                    navigate('/app');
                  }}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                >
                  🎭 Explore Demo Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="mt-20">
          <svg className="w-6 h-6 mx-auto text-purple-200 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-6 text-purple-200 text-sm">
          <a href="/privacy" className="hover:text-white transition-colors">
            Privacy Policy
          </a>
          <span>•</span>
          <a href="/terms" className="hover:text-white transition-colors">
            Terms of Service
          </a>
          <span>•</span>
          <a href="mailto:help@trysnowball.co.uk" className="hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;