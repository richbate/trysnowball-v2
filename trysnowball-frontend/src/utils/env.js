// src/utils/env.js
export const IS_PAGES_PREVIEW =
  typeof window !== 'undefined' && /\.pages\.dev$/i.test(window.location.hostname);

export const IS_PRODUCTION_HOST =
  typeof window !== 'undefined' && /(^|\.)trysnowball\.co\.uk$/i.test(window.location.hostname);

export const IS_PREVIEW = IS_PAGES_PREVIEW && !IS_PRODUCTION_HOST;

export const FEATURE = {
  previewBypassAuth: IS_PREVIEW,     // no auth endpoint calls
  previewForceDemo:  IS_PREVIEW,     // seed demo + allow UI
};

// Debug logging
if (typeof window !== 'undefined') {
  console.log('🔍 Environment check:', {
    hostname: window.location.hostname,
    IS_PAGES_PREVIEW,
    IS_PRODUCTION_HOST,
    IS_PREVIEW,
    FEATURE
  });
  
  // Extra logging for preview
  if (IS_PREVIEW) {
    console.log('🟩 PREVIEW MODE ACTIVE - All bypass flags enabled');
  } else {
    console.log('🟨 Production mode - normal auth flow');
  }
}