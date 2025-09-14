#!/usr/bin/env node

const { updateArticles } = require('./update-articles.js');

console.log('🧪 Testing RSS parser with robust error handling...\n');

// Test the update function
updateArticles()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });