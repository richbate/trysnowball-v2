/**
 * A/B Testing Hook for TrySnowball
 * Provides consistent, sticky variant assignment for experiments
 */

import { useState, useEffect } from 'react';
import { analytics } from '../lib/posthog';

const HERO_CTA_VARIANTS = [
 {
  id: 'A',
  name: 'Control',
  headline: 'Build your debt payoff plan in 2 minutes',
  subheading: 'Join thousands using the debt snowball method to become debt-free faster.',
  ctaText: 'Start free in beta',
  ctaAction: 'signup'
 },
 {
  id: 'B', 
  name: 'Trial-Oriented',
  headline: 'Start your debt-free journey — now in open beta',
  subheading: 'Join others using the snowball method with real APR math.',
  ctaText: 'Start free beta',
  ctaAction: 'signup'
 },
 {
  id: 'C',
  name: 'Emotional Appeal', 
  headline: 'Take control of your debt — now in open beta',
  subheading: 'Build a realistic plan. UK-focused. No-nonsense. No judgment.',
  ctaText: 'Start free beta — no card needed',
  ctaAction: 'signup'
 }
];

/**
 * Hook for A/B testing hero section variants
 * Provides sticky assignment and tracking
 */
export function useABVariant(testName = 'hero_cta', variants = HERO_CTA_VARIANTS) {
 const [variant, setVariant] = useState(null);
 const [isLoaded, setIsLoaded] = useState(false);

 useEffect(() => {
  const storageKey = `ab_test_${testName}`;
  
  try {
   // Check for existing assignment
   let assignedVariant = localStorage.getItem(storageKey);
   
   if (!assignedVariant || !variants.find(v => v.id === assignedVariant)) {
    // Assign new variant randomly
    const randomIndex = Math.floor(Math.random() * variants.length);
    assignedVariant = variants[randomIndex].id;
    localStorage.setItem(storageKey, assignedVariant);
    
    console.log(`[A/B Test] New assignment for ${testName}: ${assignedVariant}`);
   }
   
   const variantData = variants.find(v => v.id === assignedVariant);
   setVariant(variantData);
   
   // Track variant display
   if (variantData) {
    analytics.track('experiment_variant_displayed', {
     test_name: testName,
     variant: variantData.id,
     variant_name: variantData.name,
     timestamp: new Date().toISOString()
    });
   }
   
  } catch (error) {
   console.warn('[A/B Test] Error with variant assignment, falling back to control:', error);
   setVariant(variants[0]); // Default to first variant (control)
  }
  
  setIsLoaded(true);
 }, [testName, variants]);

 /**
  * Track when user interacts with the variant
  */
 const trackInteraction = (action, additionalData = {}) => {
  if (!variant) return;
  
  analytics.track(`${action}_clicked`, {
   test_name: testName,
   variant: variant.id,
   variant_name: variant.name,
   cta_text: variant.ctaText,
   cta_action: variant.ctaAction,
   ...additionalData
  });
 };

 /**
  * Get current variant assignment for debugging
  */
 const getDebugInfo = () => ({
  testName,
  variantId: variant?.id,
  variantName: variant?.name,
  isLoaded,
  totalVariants: variants.length
 });

 return {
  variant,
  isLoaded,
  trackInteraction,
  getDebugInfo
 };
}

/**
 * Admin utility to force a specific variant (for testing)
 */
export function forceABVariant(testName, variantId) {
 const storageKey = `ab_test_${testName}`;
 localStorage.setItem(storageKey, variantId);
 console.log(`[A/B Test] Forced variant ${variantId} for ${testName}`);
 window.location.reload(); // Reload to apply change
}

/**
 * Admin utility to reset A/B test assignment
 */
export function resetABVariant(testName) {
 const storageKey = `ab_test_${testName}`;
 localStorage.removeItem(storageKey);
 console.log(`[A/B Test] Reset assignment for ${testName}`);
 window.location.reload();
}

// Export admin functions to window for debugging (dev only)
if (process.env.NODE_ENV === 'development') {
 window.forceABVariant = forceABVariant;
 window.resetABVariant = resetABVariant;
}

export default useABVariant;