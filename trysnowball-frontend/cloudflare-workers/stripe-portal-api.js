/**
 * Stripe Customer Portal API
 * Creates Stripe customer portal sessions for subscription management
 */

import { getAuthenticatedUserId } from './debts-api.js';

const StripePortalAPI = {
  async createPortalSession(request, env) {
    try {
      // Verify user is authenticated
      const userId = await getAuthenticatedUserId(request, env);
      
      const { customerEmail, returnUrl } = await request.json();
      
      if (!customerEmail || !returnUrl) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: customerEmail, returnUrl' 
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Find or create Stripe customer
      let customerId;
      
      // First, try to get existing customer by email
      const existingCustomerResponse = await fetch(`https://api.stripe.com/v1/customers?email=${encodeURIComponent(customerEmail)}&limit=1`, {
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!existingCustomerResponse.ok) {
        throw new Error('Failed to search for existing customer');
      }

      const existingCustomerData = await existingCustomerResponse.json();
      
      if (existingCustomerData.data && existingCustomerData.data.length > 0) {
        customerId = existingCustomerData.data[0].id;
      } else {
        // Create new customer if none exists
        const newCustomerResponse = await fetch('https://api.stripe.com/v1/customers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'email': customerEmail,
            'metadata[user_id]': userId
          })
        });

        if (!newCustomerResponse.ok) {
          throw new Error('Failed to create customer');
        }

        const newCustomerData = await newCustomerResponse.json();
        customerId = newCustomerData.id;
      }

      // Create customer portal session
      const portalSession = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'customer': customerId,
          'return_url': returnUrl
        })
      });

      if (!portalSession.ok) {
        const error = await portalSession.text();
        console.error('Stripe Portal API error:', error);
        throw new Error('Failed to create customer portal session');
      }

      const session = await portalSession.json();
      
      return new Response(JSON.stringify({
        url: session.url
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });

    } catch (error) {
      console.error('Portal session creation error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

// Cloudflare Worker fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
    
    // Handle portal session creation
    if (request.method === 'POST' && url.pathname === '/api/create-portal-session') {
      return await StripePortalAPI.createPortalSession(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};