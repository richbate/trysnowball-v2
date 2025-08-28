// src/utils/demoSeed.js
export function ensureDemoDataSeeded(debtsManager) {
  try {
    localStorage.setItem('SNOWBALL_DEMO_FLAG', '1');
    
    const demo = [
      { 
        id: 'visa', 
        name: 'Visa Card', 
        balance: 1200, 
        interestRate: 19.9, 
        minPayment: 35,
        type: 'Credit Card'
      },
      { 
        id: 'paypal', 
        name: 'PayPal Credit', 
        balance: 600, 
        interestRate: 20.0, 
        minPayment: 25,
        type: 'Credit Card'
      },
    ];
    
    // Try different methods depending on manager API
    if (debtsManager?.bulkAdd) {
      debtsManager.bulkAdd(demo);
    } else if (debtsManager?.setDebts) {
      debtsManager.setDebts(demo);
    } else {
      demo.forEach(d => debtsManager?.addDebt?.(d));
    }
    
    console.info('[demoSeed] seeded', demo.length, 'debts');
    return demo;
  } catch (e) {
    console.warn('[demoSeed] failed (non-blocking)', e);
    return [];
  }
}