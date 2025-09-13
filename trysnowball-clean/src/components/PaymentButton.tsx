/**
 * Payment Button Component
 * Handles Stripe checkout integration for beta subscriptions
 */

import React, { useState } from 'react';

interface PaymentButtonProps {
  priceId?: string;
  className?: string;
  children: React.ReactNode;
}

export default function PaymentButton({
  priceId = process.env.REACT_APP_STRIPE_PRICE_ID || 'price_beta_annual',
  className = '',
  children
}: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual Stripe checkout session creation
      // This would typically call your backend API to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/upgrade`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionUrl } = await response.json();

      // Redirect to Stripe Checkout
      if (sessionUrl) {
        window.location.href = sessionUrl;
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Unable to process payment. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className={`${className} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} relative`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
            Processing...
          </span>
        ) : (
          children
        )}
      </button>
      {error && (
        <p className="text-red-300 text-sm mt-2">{error}</p>
      )}
    </>
  );
}