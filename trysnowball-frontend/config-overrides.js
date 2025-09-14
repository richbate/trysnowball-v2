// react-app-rewired configuration
// Strips console logs in production build while preserving errors
// Enables sourcemaps and readable chunk names for debugging
const webpack = require('webpack');

module.exports = function override(config, env) {
  const isProduction = env === 'production';
  const isDev = env === 'development';
  
  // Add TypeScript file resolution support
  config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
  
  if (isProduction) {
    // Enable sourcemaps for better error tracking
    config.devtool = 'source-map';
    
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
    
    // Make chunk names more readable
    config.optimization = {
      ...config.optimization,
      chunkIds: 'named',
      moduleIds: 'named',
      
      // Configure code splitting for better debugging
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          
          // Vendor chunks with descriptive names
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20
          },
          
          // Common components chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          
          // Separate chunks for major libraries
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
            name: 'react-libs',
            chunks: 'all',
            priority: 30
          },
          
          posthog: {
            test: /[\\/]node_modules[\\/]posthog-js[\\/]/,
            name: 'analytics-posthog',
            chunks: 'all',
            priority: 25
          },
          
          charts: {
            test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
            name: 'charts-recharts',
            chunks: 'all',
            priority: 25
          }
        }
      }
    };
    
    // Add more descriptive chunk naming
    if (config.output) {
      config.output.chunkFilename = 'static/js/[name].[contenthash:8].chunk.js';
    }
  }
  
  // Add build timestamp and version to environment
  config.plugins = config.plugins || [];
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString()),
      'process.env.BUILD_VERSION': JSON.stringify(process.env.REACT_APP_VERSION || 'unknown')
    })
  );
  
  // ESLint webpack plugin configuration for development
  if (isDev) {
    const eslintPlugin = config.plugins.find(
      p => p && p.constructor && p.constructor.name === 'ESLintWebpackPlugin'
    );
    
    if (eslintPlugin) {
      // Downgrade ESLint errors to warnings in development
      eslintPlugin.options = {
        ...eslintPlugin.options,
        emitWarning: true,
        failOnError: false,
        failOnWarning: false
      };
    }
  }
  
  return config;
};