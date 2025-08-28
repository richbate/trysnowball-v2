#!/usr/bin/env node
/**
 * Image optimization script
 * Optimizes SVG files and provides recommendations for PNG files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🖼️  Optimizing images...\n');

// Find and optimize SVG files
function optimizeSVGs() {
  const svgPaths = [
    'public/favicon.svg',
    'src/logo.svg'
  ];

  console.log('📐 Optimizing SVG files:');
  svgPaths.forEach(svgPath => {
    if (fs.existsSync(svgPath)) {
      try {
        const beforeStats = fs.statSync(svgPath);
        const beforeSize = beforeStats.size;
        
        execSync(`npx svgo --input ${svgPath} --output ${svgPath} --quiet`, { stdio: 'inherit' });
        
        const afterStats = fs.statSync(svgPath);
        const afterSize = afterStats.size;
        const savings = ((beforeSize - afterSize) / beforeSize * 100).toFixed(1);
        
        console.log(`  ✅ ${svgPath}: ${beforeSize} → ${afterSize} bytes (${savings}% reduction)`);
      } catch (error) {
        console.log(`  ⚠️  ${svgPath}: Optimization failed`);
      }
    }
  });
}

// Analyze PNG files for optimization opportunities
function analyzePNGs() {
  const pngFiles = [
    'public/logo-transparent.png',
    'public/web-app-manifest-512x512.png',
    'public/web-app-manifest-192x192.png',
    'public/apple-touch-icon.png'
  ];

  console.log('\n📊 PNG file analysis:');
  pngFiles.forEach(pngPath => {
    if (fs.existsSync(pngPath)) {
      const stats = fs.statSync(pngPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      
      if (stats.size > 100 * 1024) { // > 100KB
        console.log(`  ⚠️  ${pngPath}: ${sizeKB}KB (consider optimization)`);
      } else {
        console.log(`  ✅ ${pngPath}: ${sizeKB}KB (good size)`);
      }
    }
  });
}

// Run optimizations
optimizeSVGs();
analyzePNGs();

console.log('\n🎉 Image optimization complete!');
console.log('\n💡 Recommendations:');
console.log('  - Use SVG for logos and icons when possible');
console.log('  - Consider WebP format for large images in modern browsers');
console.log('  - Use appropriate image dimensions for different use cases');
console.log('  - Implement responsive images with srcset for better performance');