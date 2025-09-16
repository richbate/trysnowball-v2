import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { requestMagicLink } from '../utils/magicLinkAuth';
import { analytics } from '../lib/posthog';

const LoginMagic = () => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await requestMagicLink(email);
      
      if (error) {
        setError(error.message);
        analytics.track('login_failed', {
          email: email,
          error: error.message
        });
      } else {
        setSent(true);
        // Get context for signup tracking
        const localDebts = JSON.parse(localStorage.getItem('debts') || '[]');
        const totalDebt = localDebts.reduce((sum, debt) => sum + (debt.balance || 0), 0);
        
        analytics.track('magic_link_requested', {
          email: email,
          debts_count: localDebts.length,
          total_debt: totalDebt,
          has_debt_data: localDebts.length > 0
        });
      }
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={`min-h-screen ${colors.background} flex items-center justify-center px-4`}>
        <div className={`max-w-md w-full ${colors.surface} p-8 rounded-lg shadow-lg border ${colors.border}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <h2 className={`text-2xl font-bold ${colors.text.primary} mb-4`}>
              Check Your Email
            </h2>
            <p className={`${colors.text.secondary} mb-6`}>
              We've sent a secure login link to:
            </p>
            <p className={`font-medium ${colors.text.primary} mb-6`}>
              {email}
            </p>
            <p className={`text-sm ${colors.text.muted} mb-6`}>
              Click the link in your email to log in. The link will expire in 15 minutes for your security.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail('');
              }}
              className={`text-primary hover:underline text-sm`}
            >
              Try a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background} flex items-center justify-center px-4`}>
      <div className={`max-w-md w-full ${colors.surface} p-8 rounded-lg shadow-lg border ${colors.border}`}>
        <div className="text-center mb-8">
          <img 
            src="/logo-transparent.png" 
            alt="TrySnowball" 
            className="h-16 mx-auto mb-4"
          />
          <h2 className={`text-2xl font-bold ${colors.text.primary}`}>
            Welcome to TrySnowball
          </h2>
          <p className={`${colors.text.secondary} mt-2`}>
            Enter your email to get a secure login link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${colors.text.primary} mb-2`}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${colors.surface} ${colors.border} ${colors.text.primary}`}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className={`w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending Magic Link...
              </div>
            ) : (
              '🔗 Send Magic Link'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className={`text-xs ${colors.text.muted} space-y-2`}>
            <p>🔐 Secure, passwordless authentication</p>
            <p>✉️ No passwords to remember</p>
            <p>⚡ One-click login from your email</p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className={`text-xs ${colors.text.muted}`}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginMagic;