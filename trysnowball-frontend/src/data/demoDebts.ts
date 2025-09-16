/**
 * Single source of truth for demo debt data
 */

export type DemoLocale = 'uk' | 'default';

export function generateDemoDebts(locale: DemoLocale = 'uk') {
  // Use consistent timestamps for demo data
  const baseDate = new Date('2024-01-01').toISOString();
  
  if (locale === 'uk') {
    return [
      {
        id: 'demo_paypal',
        name: 'PayPal Credit',
        type: 'Store Card',
        balance: 620,
        originalAmount: 620,
        minPayment: 25,
        interestRate: 24.9,
        order: 3,
        isDemo: true,
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'demo_barclaycard',
        name: 'Barclaycard',
        type: 'Credit Card',
        balance: 402,
        originalAmount: 402,
        minPayment: 20,
        interestRate: 21.9,
        order: 4,
        isDemo: true,
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'demo_halifax1',
        name: 'Halifax Credit Card',
        type: 'Credit Card',
        balance: 8692,
        originalAmount: 8692,
        minPayment: 180,
        interestRate: 19.9,
        order: 2,
        isDemo: true,
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'demo_halifax2',
        name: 'Halifax Card 2',
        type: 'Credit Card',
        balance: 453,
        originalAmount: 453,
        minPayment: 18,
        interestRate: 19.9,
        order: 5,
        isDemo: true,
        createdAt: baseDate,
        updatedAt: baseDate
      },
      {
        id: 'demo_mbna',
        name: 'MBNA Card',
        type: 'Credit Card',
        balance: 2002,
        originalAmount: 2002,
        minPayment: 60,
        interestRate: 22.9,
        order: 1,
        isDemo: true,
        createdAt: baseDate,
        updatedAt: baseDate
      }
    ];
  }
  
  // fallback / international
  return [
    {
      id: 'demo_visa',
      name: 'Visa Card',
      type: 'Credit Card',
      balance: 1100,
      originalAmount: 1100,
      minPayment: 35,
      interestRate: 19.9,
      order: 1,
      isDemo: true,
      createdAt: baseDate,
      updatedAt: baseDate
    },
    {
      id: 'demo_paypal',
      name: 'PayPal Credit',
      type: 'Store Card',
      balance: 520,
      originalAmount: 520,
      minPayment: 25,
      interestRate: 23.9,
      order: 2,
      isDemo: true,
      createdAt: baseDate,
      updatedAt: baseDate
    },
    {
      id: 'demo_loan',
      name: 'Personal Loan',
      type: 'Personal Loan',
      balance: 3400,
      originalAmount: 3400,
      minPayment: 120,
      interestRate: 7.9,
      order: 3,
      isDemo: true,
      createdAt: baseDate,
      updatedAt: baseDate
    }
  ];
}