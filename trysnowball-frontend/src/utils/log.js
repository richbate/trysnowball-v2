// Production-safe logging utilities
export const isProd = process.env.NODE_ENV === 'production';

// Use these instead of direct console.* calls in app code
export const log = (...args) => { 
  if (!isProd) console.log(...args); 
};

export const warn = (...args) => { 
  if (!isProd) console.warn(...args); 
};

export const info = (...args) => { 
  if (!isProd) console.info(...args); 
};

// Always allow errors in all environments
export const error = (...args) => { 
  console.error(...args); 
};

// Debug-only logs (completely stripped in production)
export const debug = (...args) => { 
  if (process.env.NODE_ENV === 'development') console.log('[DEBUG]', ...args); 
};