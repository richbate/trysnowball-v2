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
    debt_type: 'Store Card',
    amount_pennies: 62000, // £620 in pence
    original_amount_pennies: 62000,
    min_payment_pennies: 2500, // £25 in pence
    apr: 2490, // 24.9% in percentage
    order: 3,
    isDemo: true,
    createdAt: baseDate,
    updatedAt: baseDate
   },
   {
    id: 'demo_barclaycard',
    name: 'Barclaycard',
    debt_type: 'Credit Card',
    amount_pennies: 40200, // £402 in pence
    original_amount_pennies: 40200,
    min_payment_pennies: 2000, // £20 in pence
    apr: 2190, // 21.9% in percentage
    order: 4,
    isDemo: true,
    createdAt: baseDate,
    updatedAt: baseDate
   },
   {
    id: 'demo_halifax1',
    name: 'Halifax Credit Card',
    debt_type: 'Credit Card',
    amount_pennies: 869200, // £8692 in pence
    original_amount_pennies: 869200,
    min_payment_pennies: 18000, // £180 in pence
    apr: 1990, // 19.9% in percentage
    order: 2,
    isDemo: true,
    createdAt: baseDate,
    updatedAt: baseDate
   },
   {
    id: 'demo_halifax2',
    name: 'Halifax Card 2',
    debt_type: 'Credit Card',
    amount_pennies: 45300, // £453 in pence
    original_amount_pennies: 45300,
    min_payment_pennies: 1800, // £18 in pence
    apr: 1990, // 19.9% in percentage
    order: 5,
    isDemo: true,
    createdAt: baseDate,
    updatedAt: baseDate
   },
   {
    id: 'demo_mbna',
    name: 'MBNA Card',
    debt_type: 'Credit Card',
    amount_pennies: 200200, // £2002 in pence
    original_amount_pennies: 200200,
    min_payment_pennies: 6000, // £60 in pence
    apr: 2290, // 22.9% in percentage
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
   debt_type: 'Credit Card',
   amount_pennies: 110000, // $1100 in pence
   original_amount_pennies: 110000,
   min_payment_pennies: 3500, // $35 in pence
   apr: 1990, // 19.9% in percentage
   order: 1,
   isDemo: true,
   createdAt: baseDate,
   updatedAt: baseDate
  },
  {
   id: 'demo_paypal_intl',
   name: 'PayPal Credit',
   debt_type: 'Store Card',
   amount_pennies: 52000, // $520 in pence
   original_amount_pennies: 52000,
   min_payment_pennies: 2500, // $25 in pence
   apr: 2390, // 23.9% in percentage
   order: 2,
   isDemo: true,
   createdAt: baseDate,
   updatedAt: baseDate
  },
  {
   id: 'demo_loan',
   name: 'Personal Loan',
   debt_type: 'Personal Loan',
   amount_pennies: 340000, // $3400 in pence
   original_amount_pennies: 340000,
   min_payment_pennies: 12000, // $120 in pence
   apr: 790, // 7.9% in percentage
   order: 3,
   isDemo: true,
   createdAt: baseDate,
   updatedAt: baseDate
  }
 ];
}