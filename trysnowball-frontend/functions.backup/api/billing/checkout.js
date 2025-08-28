/**
 * Stripe Checkout Session Creation
 * POST /api/billing/checkout
 * Creates one-time payment session for £10 Beta Access
 */

import jwt from '../../_lib/jwt.js';
import { corsHeaders, handleError } from '../../_lib/utils.js';

export async function onRequestPost({ request, env }) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Authenticate user
    const user = await jwt.getUserFromRequest(request, env);
    if (!user) {
      return handleError('Authentication required', 401);
    }

    // Parse request body
    const { success_url, cancel_url, productType } = await request.json();
    
    if (!success_url || !cancel_url) {
      return handleError('success_url and cancel_url required', 400);
    }

    // Create Stripe checkout session
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "payment_method_types[]": "card",
        success_url,
        cancel_url,
        "line_items[0][price]": env.PRICE_LIFETIME_BETA,
        "line_items[0][quantity]": "1",
        customer_email: user.email,
        "metadata[userId]": user.id,
        "metadata[kind]": productType || "beta_access",
        "metadata[userEmail]": user.email,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe checkout failed:', error);
      return handleError('Failed to create checkout session', 500);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({ 
      url: data.url,
      sessionId: data.id 
    }), {
      headers: { 
        ...corsHeaders,
        "content-type": "application/json" 
      }
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return handleError('Internal server error', 500);
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}