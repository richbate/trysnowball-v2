/**
 * ValidateDebt Tests
 * Lock in happy/angry path behavior for runtime debt validation
 */

import { validateDebt, validateDebts } from '../../src/lib/validateDebt';

describe('validateDebt', () => {
  test('accepts valid debt', () => {
    const validDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100,
      apr_bps: 1500,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(validDebt)).not.toThrow();
  });

  test('rejects NaN amount_cents', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: NaN,
      apr_bps: 1500,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/amount_cents invalid/);
  });

  test('rejects non-integer amount_cents', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100.5,
      apr_bps: 1500,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/amount_cents not int/);
  });

  test('rejects negative apr_bps', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100,
      apr_bps: -100,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/apr_bps invalid/);
  });

  test('rejects non-integer apr_bps', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100,
      apr_bps: 15.5,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/apr_bps invalid/);
  });

  test('rejects negative min_payment_cents', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100,
      apr_bps: 1500,
      min_payment_cents: -10
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/min_payment_cents invalid/);
  });

  test('rejects missing id/name', () => {
    const invalidDebt = {
      amount_cents: 100,
      apr_bps: 1500,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt))
      .toThrow(/id\/name missing/);
  });

  test('rejects non-object input', () => {
    expect(() => validateDebt(null))
      .toThrow(/debt not an object/);
      
    expect(() => validateDebt("string"))
      .toThrow(/debt not an object/);
  });

  test('includes location context in error messages', () => {
    const invalidDebt = {
      id: '1',
      name: 'Test',
      amount_cents: NaN,
      apr_bps: 1500,
      min_payment_cents: 25
    };
    
    expect(() => validateDebt(invalidDebt, 'testContext'))
      .toThrow(/\[testContext\]/);
  });

  test('accepts optional fields', () => {
    const validDebtWithOptionals = {
      id: '1',
      name: 'Test Debt',
      amount_cents: 100,
      apr_bps: 1500,
      min_payment_cents: 25,
      debt_type: 'credit_card',
      isDemo: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };
    
    expect(() => validateDebt(validDebtWithOptionals)).not.toThrow();
  });
});

describe('validateDebts', () => {
  test('accepts valid debt array', () => {
    const validDebts = [
      {
        id: '1',
        name: 'Debt 1',
        amount_cents: 100,
        apr_bps: 1500,
        min_payment_cents: 25
      },
      {
        id: '2',
        name: 'Debt 2',
        amount_cents: 200,
        apr_bps: 1800,
        min_payment_cents: 30
      }
    ];
    
    expect(() => validateDebts(validDebts)).not.toThrow();
  });

  test('rejects non-array input', () => {
    expect(() => validateDebts(null as any))
      .toThrow(/not array/);
      
    expect(() => validateDebts({} as any))
      .toThrow(/not array/);
  });

  test('rejects array with invalid debt', () => {
    const mixedDebts = [
      {
        id: '1',
        name: 'Valid Debt',
        amount_cents: 100,
        apr_bps: 1500,
        min_payment_cents: 25
      },
      {
        id: '2',
        name: 'Invalid Debt',
        amount_cents: NaN,
        apr_bps: 1800,
        min_payment_cents: 30
      }
    ];
    
    expect(() => validateDebts(mixedDebts))
      .toThrow(/amount_cents invalid/);
  });

  test('includes array index in error messages', () => {
    const invalidDebts = [
      {
        id: '1',
        name: 'Valid Debt',
        amount_cents: 100,
        apr_bps: 1500,
        min_payment_cents: 25
      },
      {
        id: '2',
        name: 'Invalid Debt',
        amount_cents: NaN,
        apr_bps: 1800,
        min_payment_cents: 30
      }
    ];
    
    expect(() => validateDebts(invalidDebts, 'testArray'))
      .toThrow(/\[testArray#1\]/); // Second item (index 1)
  });

  test('accepts empty array', () => {
    expect(() => validateDebts([])).not.toThrow();
  });
});