/**
 * Environment variable validation with Zod
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';

// Define the schema for environment variables
const EnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // API Configuration
  REACT_APP_API_URL: z.string().url().optional(),
  
  // Supabase Configuration (legacy)
  REACT_APP_SUPABASE_URL: z.string().url().optional(),
  REACT_APP_SUPABASE_KEY: z.string().optional(),
  
  // PostHog Analytics
  REACT_APP_POSTHOG_KEY: z.string().optional(),
  REACT_APP_POSTHOG_HOST: z.string().url().optional(),
  
  // Stripe Configuration  
  REACT_APP_STRIPE_PRICE_ID: z.string().optional(),
  
  // Feature Flags
  REACT_APP_REQUIRE_PRO: z.enum(['true', 'false']).optional().default('false'),
  REACT_APP_DEBUG_LIVE: z.enum(['true', 'false']).optional().default('false'),
  
  // GPT Configuration
  REACT_APP_GPT_ENDPOINT: z.string().url().optional(),
  REACT_APP_GPT_API_KEY: z.string().optional(),
  REACT_APP_GPT_DEBUG: z.enum(['true', 'false']).optional().default('false'),
  
  // Auth Configuration
  REACT_APP_AUTH_API_URL: z.string().optional(),
  
  // Build Information (injected at build time)
  REACT_APP_VERSION: z.string().optional(),
  REACT_APP_COMMIT_HASH: z.string().optional(),
  REACT_APP_BUILD_DATE: z.string().optional(),
});

// Parse and validate environment variables
function validateEnv() {
  try {
    const env = EnvSchema.parse(process.env);
    
    // Log successful validation in development
    if (env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
      console.log('Environment config:', {
        NODE_ENV: env.NODE_ENV,
        hasApiUrl: !!env.REACT_APP_API_URL,
        hasPostHog: !!env.REACT_APP_POSTHOG_KEY,
        hasStripe: !!env.REACT_APP_STRIPE_PRICE_ID,
        requirePro: env.REACT_APP_REQUIRE_PRO,
        debugMode: env.REACT_APP_DEBUG_LIVE
      });
    }
    
    return env;
  } catch (error) {
    console.error('❌ Environment validation failed:', error.errors);
    
    // In production, this should be a hard failure
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration. Check console for details.');
    }
    
    // In development, just warn and continue with defaults
    console.warn('⚠️ Using default values for missing environment variables');
    return EnvSchema.parse({});
  }
}

// Validate and export environment
export const env = validateEnv();

// Helper functions for common environment checks
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Feature flag helpers
export const requiresPro = env.REACT_APP_REQUIRE_PRO === 'true';
export const isDebugMode = env.REACT_APP_DEBUG_LIVE === 'true';
export const isGptDebugEnabled = env.REACT_APP_GPT_DEBUG === 'true';

// Configuration helpers
export const hasPostHog = !!env.REACT_APP_POSTHOG_KEY;
export const hasStripe = !!env.REACT_APP_STRIPE_PRICE_ID;
export const hasSupabase = !!(env.REACT_APP_SUPABASE_URL && env.REACT_APP_SUPABASE_KEY);

// Build info
export const buildInfo = {
  version: env.REACT_APP_VERSION || 'dev',
  commit: env.REACT_APP_COMMIT_HASH || 'unknown',
  buildDate: env.REACT_APP_BUILD_DATE || new Date().toISOString().split('T')[0],
};

export default env;