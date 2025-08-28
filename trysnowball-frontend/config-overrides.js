// react-app-rewired configuration
// Strips console logs in production build while preserving errors
module.exports = function override(config, env) {
  const isProduction = env === 'production';
  
  if (isProduction) {
    // Find and modify babel-loader configuration
    config.module.rules.forEach(rule => {
      (rule.oneOf || []).forEach(loader => {
        if (loader.loader && loader.loader.includes('babel-loader')) {
          loader.options.plugins = [
            ...(loader.options.plugins || []),
            ['transform-remove-console', { 
              exclude: ['error', 'warn'] // Keep error and warn in production
            }]
          ];
        }
      });
    });
  }
  
  return config;
};