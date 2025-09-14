import { normalizeLegacyDebt } from './debtNormalize';

describe('debtNormalize', () => {
 describe('normalizeLegacyDebt', () => {
  test('normalizes complete legacy debt', () => {
   const legacy = {
    id: '123',
    name: 'Test Card',
    balance: 123.45,
    interestRate: 19.9,
    minPayment: 25.00,
    type: 'Credit Card'
   };

   const result = normalizeLegacyDebt(legacy);

   expect(result.amount_pennies).toBe(12345);
   expect(result.apr).toBe(1990);
   expect(result.min_payment_pennies).toBe(2500);
   expect(result.id).toBe('123');
   expect(result.name).toBe('Test Card');
   expect(result.type).toBe('Credit Card');
  });

  test('handles alternative field names', () => {
   const legacy = {
    amount: 50.00,
    apr_pct: 15.5,
    minPayment: 15.00
   };

   const result = normalizeLegacyDebt(legacy);

   expect(result.amount_pennies).toBe(5000);
   expect(result.apr).toBe(1550);
   expect(result.min_payment_pennies).toBe(1500);
  });

  test('handles zero values', () => {
   const legacy = {
    balance: 0,
    interestRate: 0,
    minPayment: 0
   };

   const result = normalizeLegacyDebt(legacy);

   expect(result.amount_pennies).toBe(0);
   expect(result.apr).toBe(0);
   expect(result.min_payment_pennies).toBe(0);
  });

  test('handles missing values with defaults', () => {
   const legacy = {};

   const result = normalizeLegacyDebt(legacy);

   expect(result.amount_pennies).toBe(0);
   expect(result.apr).toBe(0);
   expect(result.min_payment_pennies).toBe(0);
  });

  test('removes legacy fields from output', () => {
   const legacy = {
    balance: 100,
    interestRate: 10,
    minPayment: 25,
    amount: 50,
    apr_pct: 15
   };

   const result = normalizeLegacyDebt(legacy);

   expect(result).not.toHaveProperty('balance');
   expect(result).not.toHaveProperty('interestRate');
   expect(result).not.toHaveProperty('minPayment');
   expect(result).not.toHaveProperty('amount');
   expect(result).not.toHaveProperty('apr_pct');
  });

  test('preserves other fields', () => {
   const legacy = {
    balance: 100,
    interestRate: 10,
    minPayment: 25,
    id: '456',
    name: 'Another Card',
    order: 2,
    customField: 'preserved'
   };

   const result = normalizeLegacyDebt(legacy);

   expect(result.id).toBe('456');
   expect(result.name).toBe('Another Card');
   expect(result.order).toBe(2);
   expect(result.customField).toBe('preserved');
  });
 });
});