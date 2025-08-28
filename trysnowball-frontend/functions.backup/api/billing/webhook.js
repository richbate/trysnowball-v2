/**
 * Stripe Webhook Handler  
 * POST /api/billing/webhook
 * Processes payment completion and grants Beta access
 */

export async function onRequestPost({ request, env }) {
  try {
    const sig = request.headers.get("stripe-signature");
    const body = await request.text();

    if (!sig) {
      console.error('No Stripe signature found');
      return new Response('No signature', { status: 400 });
    }

    // Verify Stripe signature to ensure webhook is legitimate
    let event;
    try {
      // In production, you should use Stripe's webhook signature verification:
      // const stripe = require('stripe')(env.STRIPE_SECRET_KEY);
      // event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
      
      // For now, basic validation - parse JSON and verify signature exists
      event = JSON.parse(body);
      
      // TODO: Implement full signature verification when Stripe SDK is available
      if (!env.STRIPE_WEBHOOK_SECRET) {
        console.warn('STRIPE_WEBHOOK_SECRET not configured - webhook signature not verified');
      }
    } catch (err) {
      console.error('Invalid webhook payload:', err);
      return new Response('Invalid payload', { status: 400 });
    }

    console.log('Webhook event:', event.type, event.data?.object?.id);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const userEmail = session.metadata?.userEmail;
      
      if (!userId) {
        console.error('No userId in session metadata:', session.metadata);
        return new Response('Missing userId', { status: 400 });
      }

      // Grant Beta access
      const entitlement = {
        betaAccess: true,
        lifetime: true, // Legacy compatibility
        grantedAt: new Date().toISOString(),
        stripe_session: session.id,
        stripe_payment_intent: session.payment_intent,
        source: "stripe:beta_access",
        userEmail: userEmail,
        amount: session.amount_total,
        currency: session.currency
      };

      await env.ENTITLEMENTS.put(`user:${userId}`, JSON.stringify(entitlement));
      
      console.log(`Beta access granted to user ${userId} (${userEmail})`);
    }
    
    // Handle refunds and disputes - revoke access
    else if (event.type === "charge.refunded" || event.type === "charge.dispute.created") {
      const charge = event.data.object;
      const userId = charge.metadata?.userId;
      
      if (userId) {
        const revocation = {
          betaAccess: false,
          lifetime: false,
          revokedAt: new Date().toISOString(),
          reason: event.type,
          original_charge: charge.id
        };

        await env.ENTITLEMENTS.put(`user:${userId}`, JSON.stringify(revocation));
        console.log(`Beta access revoked for user ${userId} due to ${event.type}`);
      }
    }

    return new Response('ok', { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Webhook error', { status: 500 });
  }
}