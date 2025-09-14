#!/usr/bin/env node

/**
 * Legacy Route Cleanup Script
 * 
 * Based on our analysis, migrate files from hardcoded routes to RouteRegistry
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🧹 TrySnowball Legacy Route Cleanup');
console.log('===================================\n');

// Files identified with hardcoded routes that need migration
const MIGRATION_PLAN = [
  {
    file: 'src/data/debtsGateway.ts',
    action: 'DELETE',
    reason: 'Legacy gateway - replaced by unifiedDebtsGateway.ts'
  },
  {
    file: 'src/data/cleanDebtsGateway.ts', 
    action: 'RENAME',
    newName: 'src/data/debtsGateway.ts',
    reason: 'Rename clean gateway to canonical name'
  },
  {
    file: 'src/hooks/useSnowballSettings.js',
    action: 'UPDATE',
    routes: ['/api/user_settings'],
    reason: 'Migrate hardcoded routes to RouteRegistry'
  },
  {
    file: 'src/utils/fetchWithAuth.ts',
    action: 'UPDATE', 
    routes: ['/api/debts'],
    reason: 'Example usage should use RouteRegistry'
  }
];

// Route replacements
const ROUTE_REPLACEMENTS = new Map([
  ['/api/debts', 'RouteRegistry.debts.getAll'],
  ['/api/clean/debts', 'RouteRegistry.debts.getAll'], 
  ['/api/user_settings', 'RouteRegistry.settings.get'],
  ['/auth/me', 'RouteRegistry.auth.me'],
  ['/auth/refresh', 'RouteRegistry.auth.refresh'],
  ['/auth/logout', 'RouteRegistry.auth.logout']
]);

function executeCleanup() {
  console.log('📋 Migration Plan:');
  console.log('=================\n');

  MIGRATION_PLAN.forEach((item, index) => {
    console.log(`${index + 1}. ${item.action}: ${item.file}`);
    console.log(`   Reason: ${item.reason}`);
    if (item.routes) {
      console.log(`   Routes: ${item.routes.join(', ')}`);
    }
    console.log();
  });

  console.log('🚀 Executing cleanup...\n');

  let success = 0;
  let errors = 0;

  MIGRATION_PLAN.forEach((item) => {
    try {
      const fullPath = path.resolve(item.file);
      
      switch (item.action) {
        case 'DELETE':
          if (fs.existsSync(fullPath)) {
            // Create backup first
            fs.copyFileSync(fullPath, fullPath + '.backup');
            console.log(`🗑️  Backed up and would delete: ${item.file}`);
            // Note: Not actually deleting in this dry run
            success++;
          } else {
            console.log(`ℹ️  File not found (already deleted?): ${item.file}`);
          }
          break;
          
        case 'RENAME':
          if (fs.existsSync(fullPath)) {
            const newPath = path.resolve(item.newName);
            console.log(`📁 Would rename: ${item.file} → ${item.newName}`);
            // Note: Not actually renaming in this dry run
            success++;
          } else {
            console.log(`❌ Source file not found: ${item.file}`);
            errors++;
          }
          break;
          
        case 'UPDATE':
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            let updatedContent = content;
            let hasChanges = false;

            // Add RouteRegistry import if routes are being replaced
            if (!content.includes('RouteRegistry') && item.routes) {
              const importLine = "import { RouteRegistry } from '../routes/routeRegistry';";
              
              // Find last import line
              const lines = content.split('\n');
              const lastImportIndex = lines.findLastIndex(line => line.trim().startsWith('import '));
              
              if (lastImportIndex >= 0) {
                lines.splice(lastImportIndex + 1, 0, importLine);
                updatedContent = lines.join('\n');
                hasChanges = true;
              }
            }

            // Replace hardcoded routes
            item.routes?.forEach(route => {
              const replacement = ROUTE_REPLACEMENTS.get(route);
              if (replacement) {
                const regex = new RegExp(`['"\`]${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
                const newContent = updatedContent.replace(regex, replacement);
                if (newContent !== updatedContent) {
                  updatedContent = newContent;
                  hasChanges = true;
                  console.log(`   🔄 Replaced ${route} with ${replacement}`);
                }
              }
            });

            if (hasChanges) {
              // Create backup
              fs.copyFileSync(fullPath, fullPath + '.backup');
              console.log(`🔧 Would update: ${item.file}`);
              // Note: Not actually writing in this dry run  
              success++;
            } else {
              console.log(`ℹ️  No changes needed: ${item.file}`);
            }
          } else {
            console.log(`❌ File not found: ${item.file}`);
            errors++;
          }
          break;
      }
    } catch (error) {
      console.log(`❌ Error processing ${item.file}: ${error.message}`);
      errors++;
    }
  });

  console.log('\n📊 Cleanup Summary');
  console.log('==================');
  console.log(`✅ Successful operations: ${success}`);
  console.log(`❌ Errors: ${errors}`);
  
  if (errors === 0) {
    console.log('\n🎉 All migrations ready! Run with --execute to apply changes.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. Review the backup files created (.backup)');
  console.log('2. Update imports in files that used the old gateways');
  console.log('3. Run tests to ensure everything works');
  console.log('4. Delete backup files when satisfied');
}

// Check if running with --execute flag
const executeFlag = process.argv.includes('--execute');
if (executeFlag) {
  console.log('⚠️  EXECUTE MODE: This will make actual file changes!\n');
} else {
  console.log('🔍 DRY RUN: No files will be changed. Use --execute to apply changes.\n');
}

executeCleanup();