import React, { useState } from 'react';
import { useUserFlow } from '../contexts/UserFlowContext';
import { useTheme } from '../contexts/ThemeContext';

const EmailPrompt = () => {
  const { showEmailPrompt, dismissEmailPrompt } = useUserFlow();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!showEmailPrompt) return null;

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
        setTimeout(() => {
          dismissEmailPrompt();
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-slide-up">
        <div className={`${colors.surface} rounded-lg shadow-lg ${colors.border} border p-6`}>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>
              Thanks! 🎉
            </h3>
            <p className={`text-sm ${colors.text.secondary}`}>
              We'll keep you updated on new features and debt freedom tips!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm animate-slide-up">
      <div className={`${colors.surface} rounded-lg shadow-lg ${colors.border} border p-6`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${colors.text.primary} mb-2`}>
              Stay Updated! 📧
            </h3>
            <p className={`text-sm ${colors.text.secondary} mb-4`}>
              Get notified about new features, debt freedom tips, and financial tools.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={`w-full px-3 py-2 border ${colors.border} rounded-lg ${colors.surfaceSecondary} ${colors.text.primary} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm`}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Notify Me'}
                </button>
                <button
                  type="button"
                  onClick={dismissEmailPrompt}
                  className={`px-4 py-2 ${colors.surfaceSecondary} ${colors.text.secondary} rounded-lg hover:${colors.surface} transition-colors text-sm font-medium`}
                >
                  Later
                </button>
              </div>
            </form>
          </div>
          <button
            onClick={dismissEmailPrompt}
            className={`flex-shrink-0 ${colors.text.muted} hover:${colors.text.secondary} transition-colors`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPrompt;