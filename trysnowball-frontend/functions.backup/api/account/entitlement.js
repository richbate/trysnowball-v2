/**
 * User Entitlement Endpoint
 * GET /api/account/entitlement
 * Returns user's Beta access status and quotas
 */

import jwt from '../../_lib/jwt.js';
import { corsHeaders, handleError } from '../../_lib/utils.js';

export async function onRequestGet({ request, env }) {
  try {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Authenticate user (with safe fallback)
    const user = await jwt.getUserFromRequest(request, env);
    if (!user) {
      // No auth = free tier (safe default, not an error)
      return new Response(JSON.stringify({
        isPro: false,
        betaAccess: false,
        lifetime: false,
        dailyQuota: 40,
        plan: 'free',
        reason: 'No active session'
      }), {
        headers: { 
          ...corsHeaders,
          "content-type": "application/json"
        }
      });
    }

    // Get entitlement from KV storage
    const raw = await env.ENTITLEMENTS.get(`user:${user.id}`);
    const ent = raw ? JSON.parse(raw) : { betaAccess: false, lifetime: false };
    
    // Build response with isPro for frontend compatibility
    const entitlement = {
      isPro: !!ent.betaAccess || !!ent.lifetime,  // Pro if beta or lifetime
      betaAccess: !!ent.betaAccess,                // Primary field for new system
      lifetime: !!ent.lifetime,                    // Legacy compatibility
      dailyQuota: ent.betaAccess ? 50 : 40,        // Small perk for Beta users
      plan: (ent.betaAccess || ent.lifetime) ? 'pro' : 'free',
      
      // Additional metadata (optional)
      ...(ent.grantedAt && { grantedAt: ent.grantedAt }),
      ...(ent.source && { source: ent.source }),
      ...(ent.revokedAt && { 
        revokedAt: ent.revokedAt, 
        revocationReason: ent.reason 
      })
    };

    return new Response(JSON.stringify(entitlement), {
      headers: { 
        ...corsHeaders,
        "content-type": "application/json",
        "cache-control": "private, max-age=300" // 5-minute cache
      }
    });

  } catch (error) {
    console.error('Entitlement check error:', error);
    return handleError('Internal server error', 500);
  }
}

// Handle preflight requests
export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}