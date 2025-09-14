import { useEffect, useMemo, useState } from 'react';

type Variant = string;

type Options = {
 // When PostHog not ready or flag missing, pick this variant.
 defaultVariant: Variant;
 // Optional hard sticky key (e.g. user id). If none, PostHog person id will be used.
 stickyKey?: string | null;
 // Safe guard: list of allowed variants. If PH returns something else, we fall back.
 allowed: Variant[];
 // Fire a "viewed" event on mount
 viewedEvent?: string;
 // Additional props to send with viewed/conversion
 viewedProps?: Record<string, any>;
};

declare global {
 interface Window {
  posthog?: any;
 }
}

// Lightweight PostHog read helpers with null-safety.
function getPH(): any | null {
 if (typeof window === 'undefined') return null;
 return window.posthog || null;
}

export function useExperiment(
 flagKey: string,
 opts: Options
) {
 const { defaultVariant, stickyKey, allowed, viewedEvent, viewedProps } = opts;

 const [variant, setVariant] = useState<Variant>(defaultVariant);
 const [ready, setReady] = useState(false);

 // Resolve variant once PH is ready, then keep it sticky for session.
 useEffect(() => {
  const ph = getPH();
  if (!ph) {
   setVariant(defaultVariant);
   setReady(true);
   return;
  }

  // Ensure person is identified with a sticky id if provided.
  if (stickyKey && ph.get_distinct_id && ph.get_distinct_id() !== stickyKey) {
   // Don't identify if already identified; up to you if you want to call ph.identify here.
   // ph.identify(stickyKey) // optional: only if your auth flow doesn't identify.
  }

  const resolve = () => {
   // Prefer experiments API if available, else feature flag variants
   let v: Variant | null = null;

   if (typeof ph.getCurrentExperimentVariant === 'function') {
    try { v = ph.getCurrentExperimentVariant(flagKey); } catch {}
   }
   if (!v && typeof ph.getFeatureFlag === 'function') {
    try { v = ph.getFeatureFlag(flagKey); } catch {}
   }

   let chosen = v && allowed.includes(v) ? v : defaultVariant;
   setVariant(chosen);
   setReady(true);

   if (viewedEvent) {
    try {
     ph.capture?.(viewedEvent, {
      flag: flagKey,
      variant: chosen,
      ...viewedProps,
     });
    } catch {}
   }
  };

  // If PostHog is ready now, resolve immediately; otherwise wait for init.
  if (ph.__loaded) resolve();
  else setTimeout(resolve, 0);
 }, [flagKey, defaultVariant, stickyKey, allowed, viewedEvent, viewedProps]);

 const is = useMemo(() => (name: Variant) => variant === name, [variant]);

 // Helper to mark conversion
 const convert = (eventName: string, props?: Record<string, any>) => {
  const ph = getPH();
  try {
   ph?.capture?.(eventName, { flag: flagKey, variant, ...props });
  } catch {}
 };

 return { ready, variant, is, convert };
}