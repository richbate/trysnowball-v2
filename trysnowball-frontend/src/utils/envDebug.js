// Environment variables debug utility
console.log('🔍 Environment Variables Debug:');
console.log('REACT_APP_POSTHOG_KEY:', process.env.REACT_APP_POSTHOG_KEY ? 'FOUND' : 'MISSING');
console.log('VITE_PUBLIC_POSTHOG_KEY:', process.env.VITE_PUBLIC_POSTHOG_KEY ? 'FOUND' : 'MISSING');
console.log('REACT_APP_POSTHOG_HOST:', process.env.REACT_APP_POSTHOG_HOST || 'MISSING');
console.log('VITE_PUBLIC_POSTHOG_HOST:', process.env.VITE_PUBLIC_POSTHOG_HOST || 'MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Show all env vars that start with REACT_APP_ or VITE_PUBLIC_
const envVars = Object.keys(process.env).filter(key => 
  key.startsWith('REACT_APP_') || key.startsWith('VITE_PUBLIC_')
);
console.log('Available env vars:', envVars);