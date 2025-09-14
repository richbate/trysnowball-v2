/**
 * Bulletproof Stripe Webhook Handler
 * Simple, reliable subscription management with proper idempotency
 */

// Helper: unix timestamp
const unixNow = () => Math.floor(Date.now() / 1000);

// Helper: JSON response
const json = (body, status = 200) => 
  new Response(JSON.stringify(body), { 
    status, 
    headers: { 'content-type': 'application/json' } 
  });

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

// Idempotency check - CRITICAL for webhook safety
async function ensureIdempotency(db, eventId, eventType) {
  try {
    // Check if we've already processed this event
    const existing = await db.prepare('SELECT 1 FROM stripe_events WHERE id = ?')
      .bind(eventId).first();
    
    if (existing) {
      console.log(`Event ${eventId} already processed, skipping`);
      return false; // Already processed
    }
    
    // Mark as processing
    await db.prepare('INSERT INTO stripe_events (id, type, processed_at) VALUES (?, ?, ?)')
      .bind(eventId, eventType, unixNow()).run();
    
    return true; // Safe to process
  } catch (error) {
    console.error('Idempotency check failed:', error);
    throw error;
  }
}

// Find user by Stripe customer ID
async function lookupUserByCustomer(db, customerId) {
  const row = await db.prepare('SELECT id, email FROM users WHERE stripe_customer_id = ?')
    .bind(customerId).first();
  return row || null;
}

// Find user by user_id in metadata
async function lookupUserById(db, userId) {
  const row = await db.prepare('SELECT id, email FROM users WHERE id = ?')
    .bind(userId).first();
  return row || null;
}

// Core function: flip user's is_pro flag
async function setUserProStatus(db, userId, isPro, reason, env) {
  try {
    // Get current status for change tracking
    const current = await db.prepare('SELECT is_pro FROM users WHERE id = ?')
      .bind(userId).first();
    const oldStatus = current ? !!current.is_pro : false;
    const newStatus = !!isPro;

    const result = await db.prepare('UPDATE users SET is_pro = ? WHERE id = ?')
      .bind(isPro ? 1 : 0, userId).run();

    if (result.changes === 0) {
      console.warn(`⚠️ No user found with ID: ${userId}`);
      return false;
    }

    console.log(`✅ Updated user ${userId} is_pro=${isPro} (reason: ${reason})`);
    
    // Track status changes for monitoring (only if status actually changed)
    if (oldStatus !== newStatus) {
      console.log(`📊 Plan status changed: ${oldStatus} → ${newStatus} (${reason})`);
      // TODO: Add PostHog tracking here if needed
      // posthog.capture('plan_status_changed', { userId, oldStatus, newStatus, reason });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update user pro status:', error);
    throw error;
  }
}

// Handle subscription events (created/updated)
async function handleSubscription(db, sub, env) {
  const userId = sub.metadata?.user_id;
  let user = null;

  if (userId) {
    user = await lookupUserById(db, userId);
  }
  
  if (!user) {
    // Fallback to customer lookup if no metadata
    user = await lookupUserByCustomer(db, sub.customer);
    if (!user) {
      console.error(`⚠️ Cannot find user for subscription ${sub.id}, customer ${sub.customer}`);
      return;
    }
  }

  // Determine if subscription should grant Pro access
  const goodStatuses = ['active', 'trialing'];
  const isPro = goodStatuses.includes(sub.status);
  
  await setUserProStatus(db, user.id, isPro, `subscription.${sub.status}`, env);
}

// Handle subscription deletion
async function handleSubscriptionDeleted(db, sub, env) {
  const userId = sub.metadata?.user_id;
  let user = null;

  if (userId) {
    user = await lookupUserById(db, userId);
  }
  
  if (!user) {
    user = await lookupUserByCustomer(db, sub.customer);
    if (!user) {
      console.error(`⚠️ Cannot find user for deleted subscription ${sub.id}`);
      return;
    }
  }

  await setUserProStatus(db, user.id, false, 'subscription.deleted', env);
}

// Handle checkout completion (optimistic flag flip)
async function handleCheckoutCompleted(db, session, env) {
  if (session.mode !== 'subscription') {
    console.log('Checkout completed but not subscription mode, ignoring');
    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error('⚠️ Checkout session missing user_id metadata');
    return;
  }

  const user = await lookupUserById(db, userId);
  if (!user) {
    console.error(`⚠️ User ${userId} not found for checkout completion`);
    return;
  }

  // Optimistically set to Pro - the subsequent subscription.created event will confirm/correct
  await setUserProStatus(db, user.id, true, 'checkout.completed', env);
}

// Handle successful payment (safety net)
async function handlePaymentSucceeded(db, invoice, env) {
  if (!invoice.subscription || !invoice.customer) {
    return; // Not a subscription invoice
  }

  if (!invoice.paid) {
    return; // Payment didn't actually succeed
  }

  const user = await lookupUserByCustomer(db, invoice.customer);
  if (!user) {
    console.error(`⚠️ User not found for payment success, customer ${invoice.customer}`);
    return;
  }

  await setUserProStatus(db, user.id, true, 'invoice.payment_succeeded', env);
}

// Main webhook handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only handle POST requests to /webhook/stripe
    if (request.method !== 'POST' || url.pathname !== '/webhook/stripe') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // 1. Verify webhook signature
      const event = await verifyStripeWebhook(request, env.STRIPE_WEBHOOK_SECRET);
      console.log(`🎣 Received webhook: ${event.type} (${event.id})`);
      
      // 2. Idempotency check - CRITICAL
      const shouldProcess = await ensureIdempotency(env.DB, event.id, event.type);
      if (!shouldProcess) {
        return json({ ok: true, message: 'Event already processed' });
      }

      // 3. Route event to handler
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await handleSubscription(env.DB, event.data.object, env);
          break;
          
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(env.DB, event.data.object, env);
          break;
          
        case 'checkout.session.completed':
          await handleCheckoutCompleted(env.DB, event.data.object, env);
          break;
          
        case 'invoice.payment_succeeded':
          await handlePaymentSucceeded(env.DB, event.data.object, env);
          break;
          
        default:
          console.log(`ℹ️ Ignored event type: ${event.type}`);
          break;
      }

      console.log(`✅ Successfully processed webhook ${event.id}`);
      return json({ ok: true });

    } catch (error) {
      console.error('💥 Webhook processing error:', error);
      return new Response(`Webhook error: ${error.message}`, { status: 400 });
    }
  }
};