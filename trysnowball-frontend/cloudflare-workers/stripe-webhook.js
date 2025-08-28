/**
 * Stripe Webhook Handler for TrySnowball Pro Subscriptions
 * Handles checkout completion, subscription cancellation, and payment failures
 */

// Stripe webhook signature verification
async function verifyStripeWebhook(request, webhookSecret) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    throw new Error('Missing Stripe signature');
  }

  const body = await request.text();
  const sigElements = signature.split(',');
  const timestamp = sigElements.find(element => element.startsWith('t=')).split('=')[1];
  const signatures = sigElements.filter(element => element.startsWith('v1=')).map(element => element.split('=')[1]);

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid Stripe signature format');
  }

  // Create expected signature
  const payload = timestamp + '.' + body;
  const expectedSig = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  ).then(signature => 
    Array.from(new Uint8Array(signature))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
  );

  // Verify signature matches
  const isValid = signatures.some(sig => sig === expectedSig);
  if (!isValid) {
    throw new Error('Invalid Stripe signature');
  }

  return JSON.parse(body);
}

// Update user Pro status in D1
async function updateUserProStatus(db, email, isPro, stripeCustomerId = null) {
  try {
    const updateQuery = `
      UPDATE users 
      SET isPro = ?, stripe_customer_id = ?, updated_at = datetime('now')
      WHERE email = ?
    `;
    
    const result = await db.prepare(updateQuery)
      .bind(isPro, stripeCustomerId, email)
      .run();

    if (result.changes === 0) {
      console.warn(`No user found with email: ${email}`);
      return false;
    }

    console.log(`Updated user ${email} isPro status to: ${isPro}`);
    return true;
  } catch (error) {
    console.error('Failed to update user Pro status:', error);
    throw error;
  }
}

// Track upgrade events for analytics
async function trackUpgradeEvent(env, userEmail, eventType, properties = {}) {
  try {
    // Get user ID from database
    const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
      .bind(userEmail)
      .first();
    
    if (!user) {
      console.warn(`Cannot track event - user not found: ${userEmail}`);
      return;
    }

    // Basic event data
    const eventData = {
      event: eventType,
      properties: {
        distinct_id: user.id,
        email: userEmail,
        timestamp: new Date().toISOString(),
        $set: {
          upgraded_at: new Date().toISOString(),
          [eventType.includes('founder') ? 'is_founder' : 'is_pro']: true
        },
        ...properties
      }
    };

    // Send to PostHog (if you have webhook integration)
    console.log(`📊 Tracking upgrade event: ${eventType}`, eventData);
    
    // You can add PostHog webhook call here if needed
    // For now, just log for debugging
    
  } catch (error) {
    console.error('Failed to track upgrade event:', error);
    // Don't fail the webhook for tracking errors
  }
}

// Update user Founder status in D1
async function updateUserFounderStatus(db, email, isPro, stripeCustomerId = null) {
  try {
    const updateQuery = `
      UPDATE users 
      SET isPro = ?, isFounder = ?, stripe_customer_id = ?, updated_at = datetime('now')
      WHERE email = ?
    `;
    
    const result = await db.prepare(updateQuery)
      .bind(isPro, true, stripeCustomerId, email)
      .run();

    if (result.changes === 0) {
      console.warn(`No user found with email: ${email}`);
      return false;
    }

    console.log(`Updated user ${email} to Founder status`);
    return true;
  } catch (error) {
    console.error('Failed to update user Founder status:', error);
    throw error;
  }
}

// Webhook idempotency check
async function ensureIdempotency(db, eventId, eventType) {
  try {
    // Check if we've already processed this event
    const existing = await db.prepare(
      'SELECT id FROM webhook_events WHERE id = ?'
    ).bind(eventId).first();
    
    if (existing) {
      console.log(`Event ${eventId} already processed, skipping`);
      return false; // Already processed
    }
    
    // Mark as processing
    await db.prepare(
      'INSERT INTO webhook_events (id, event_type) VALUES (?, ?)'
    ).bind(eventId, eventType).run();
    
    return true; // Safe to process
  } catch (error) {
    console.error('Idempotency check failed:', error);
    throw error;
  }
}

// Main Stripe webhook handler
const StripeWebhook = {
  async handleWebhook(request, env) {
    try {
      // Verify webhook signature
      const event = await verifyStripeWebhook(request, env.STRIPE_WEBHOOK_SECRET);
      
      console.log(`Processing Stripe event: ${event.type} (${event.id})`);
      
      // Ensure idempotency
      const shouldProcess = await ensureIdempotency(env.DB, event.id, event.type);
      if (!shouldProcess) {
        return new Response('Event already processed', { status: 200 });
      }

      switch (event.type) {
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(event, env);
          
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(event, env);
          
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(event, env);
          
        default:
          console.log(`Unhandled event type: ${event.type}`);
          return new Response('Event type not handled', { status: 200 });
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return new Response(`Webhook error: ${error.message}`, { status: 400 });
    }
  },

  // Handle successful checkout completion
  async handleCheckoutCompleted(event, env) {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const customerId = session.customer;
    const plan = session.metadata?.plan;

    if (!customerEmail) {
      console.error('No customer email in checkout session');
      return new Response('No customer email found', { status: 400 });
    }

    // Handle Founder Access (one-time payment)
    if (session.mode === 'payment' && plan === 'founder') {
      const success = await updateUserFounderStatus(env.DB, customerEmail, true, customerId);
      
      if (success) {
        console.log(`Successfully upgraded ${customerEmail} to Founder status`);
        
        // Track successful founder upgrade (canonical)
        await trackUpgradeEvent(env, customerEmail, 'user_upgraded_to_founder', {
          source: 'stripe_webhook',
          plan: 'founder',
          period: 'lifetime',
          amount_minor: session.amount_total,
          currency: session.currency,
          stripe_customer_id: customerId,
          stripe_session_id: session.id
        });
        
        return new Response('User upgraded to Founder', { status: 200 });
      } else {
        return new Response('User not found', { status: 404 });
      }
    }
    
    // Handle Pro subscription (monthly payment)
    else if (session.mode === 'subscription') {
      const success = await updateUserProStatus(env.DB, customerEmail, true, customerId);
      
      if (success) {
        console.log(`Successfully upgraded ${customerEmail} to Pro`);
        
        // Track successful pro upgrade (canonical)
        await trackUpgradeEvent(env, customerEmail, 'user_upgraded_to_pro', {
          source: 'stripe_webhook',
          plan: 'pro',
          period: 'monthly',
          amount_minor: 499, // £4.99 in pence
          currency: 'gbp',
          stripe_customer_id: customerId,
          stripe_subscription_id: session.subscription,
          stripe_session_id: session.id
        });
        
        return new Response('User upgraded to Pro', { status: 200 });
      } else {
        return new Response('User not found', { status: 404 });
      }
    }
    
    // Unknown payment mode
    else {
      console.warn(`Unknown payment mode: ${session.mode}`);
      return new Response('Unknown payment type', { status: 400 });
    }
  },

  // Handle subscription cancellation  
  async handleSubscriptionDeleted(event, env) {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    // Find user by Stripe customer ID
    const user = await env.DB.prepare(
      'SELECT email FROM users WHERE stripe_customer_id = ?'
    ).bind(customerId).first();

    if (!user) {
      console.error(`No user found for Stripe customer: ${customerId}`);
      return new Response('User not found', { status: 404 });
    }

    // Downgrade user from Pro
    const success = await updateUserProStatus(env.DB, user.email, false, customerId);
    
    if (success) {
      console.log(`Successfully downgraded ${user.email} from Pro`);
      return new Response('User downgraded from Pro', { status: 200 });
    } else {
      return new Response('Failed to downgrade user', { status: 500 });
    }
  },

  // Handle payment failures (optional - just log for now)
  async handlePaymentFailed(event, env) {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    
    console.warn(`Payment failed for customer: ${customerId}`);
    
    // Optional: You could send an email notification here
    // For now, just acknowledge the webhook
    return new Response('Payment failure logged', { status: 200 });
  }
};

// Cloudflare Worker fetch handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only handle POST requests to /webhook/stripe
    if (request.method !== 'POST' || url.pathname !== '/webhook/stripe') {
      return new Response('Not Found', { status: 404 });
    }

    return await StripeWebhook.handleWebhook(request, env);
  }
};