/**
 * Debug script for testing data synchronization across pages
 * Run in browser console to verify data consistency
 */

window.debugDataSync = {
  // Test 2: Real-time sync verification
  testRealtimeSync() {
    console.log('🧪 STRESS TEST 2: Real-time Sync');
    console.log('1. Update debt balance in /debts');
    console.log('2. Navigate to /ai/report (without reload)'); 
    console.log('3. Navigate to /my-plan (without reload)');
    console.log('4. All pages should show updated balance immediately');
    
    // Monitor data changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key.includes('debt')) {
        console.log('🔄 localStorage UPDATE:', key, JSON.parse(value).slice(0, 2));
      }
      return originalSetItem.call(this, key, value);
    };
  },

  // Check current debt data across all potential sources
  checkAllDataSources() {
    console.log('🔍 ALL DATA SOURCES:');
    
    const sources = [
      'debts',
      'trysnowball-debts',
      'debtBalances', 
      'debt-data-anonymous',
      'debt-data-dev-user-123',
      'trysnowball-demo-debts'
    ];
    
    sources.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`📦 ${key}:`, Array.isArray(parsed) ? `${parsed.length} items` : typeof parsed, parsed.slice?.(0, 1));
        } catch {
          console.log(`📦 ${key}:`, 'string data:', data.slice(0, 100));
        }
      } else {
        console.log(`📦 ${key}:`, '❌ not found');
      }
    });
  },

  // Test 3: Demo ↔ Real data switch
  testDataSwitch() {
    console.log('🧪 STRESS TEST 3: Demo ↔ Real Data Switch');
    console.log('1. Start with demo data');
    console.log('2. Log in (or simulate login)');
    console.log('3. Check no stale demo values appear');
    console.log('4. Log out'); 
    console.log('5. Check returns to clean demo state');
  },

  // Test 4: AI consistency check
  testAIConsistency() {
    console.log('🧪 STRESS TEST 4: AI Flow Consistency');
    console.log('Visit /ai/coach and verify:');
    console.log('- AI sees same debt count as /debts page');
    console.log('- Debt names/balances match exactly'); 
    console.log('- Order is consistent');
    
    // Extract debt data that AI would see
    try {
      const debtKeys = Object.keys(localStorage).filter(k => k.includes('debt'));
      debtKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data && data.includes('balance')) {
          console.log(`🤖 AI would see from ${key}:`, JSON.parse(data).map(d => `${d.name}: £${d.balance || d.amount}`));
        }
      });
    } catch (e) {
      console.log('🤖 AI data extraction failed:', e.message);
    }
  },

  // Test 5: History tracking verification  
  testHistoryTracking() {
    console.log('🧪 STRESS TEST 5: History Tracking Integration');
    console.log('1. Update a debt balance in /debts');
    console.log('2. Check debt history in /debts (📜 View History)');
    console.log('3. Check same history appears in other components');
    console.log('4. Verify history entries have proper timestamps/changes');
  }
};

console.log('🧪 Debug tools loaded! Available commands:');
console.log('debugDataSync.testRealtimeSync()');
console.log('debugDataSync.checkAllDataSources()'); 
console.log('debugDataSync.testDataSwitch()');
console.log('debugDataSync.testAIConsistency()');
console.log('debugDataSync.testHistoryTracking()');