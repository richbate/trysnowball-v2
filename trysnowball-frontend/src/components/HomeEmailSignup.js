import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const HomeEmailSignup = () => {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    
    try {
      // Submit to Netlify forms
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': 'newsletter',
          'email': email
        }).toString()
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-green-500`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className={`text-2xl font-bold ${colors.text.primary} mb-2`}>
            Thanks! 🎉
          </h3>
          <p className={`text-lg ${colors.text.secondary} mb-4`}>
            You're now subscribed to updates on new features and debt freedom tips!
          </p>
          <p className={`text-sm ${colors.text.muted}`}>
            Check your email for a confirmation link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${colors.surface} rounded-lg p-8 border-l-4 border-blue-500`}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className={`text-3xl font-bold ${colors.text.primary} mb-2`}>
          Stay Updated 📧
        </h2>
        <p className={`text-lg ${colors.text.secondary} mb-4`}>
          Get notified about new features, debt freedom tips, and financial tools.
        </p>
        <p className={`text-sm ${colors.text.muted}`}>
          No spam, just useful updates when we have something worth sharing.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="max-w-md mx-auto">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className={`flex-1 px-4 py-3 border ${colors.border} rounded-lg ${colors.surfaceSecondary} ${colors.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? 'Sending...' : 'Notify Me'}
          </button>
        </div>
      </form>
      
      <div className="text-center mt-4">
        <p className={`text-xs ${colors.text.muted}`}>
          Free to subscribe • Unsubscribe anytime • UK-focused content
        </p>
      </div>
    </div>
  );
};

export default HomeEmailSignup;