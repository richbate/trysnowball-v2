/**
 * @jest-environment jsdom
 */

/**
 * Golden Master Snapshots
 * Capture critical function outputs to catch unexpected changes
 * Ensures debt calculations, timeline generation remain consistent
 */

import { safeNormalizeDebts } from '../../src/utils/safeDebtNormalizer';
import { generatePayoffTimeline } from '../../src/utils/generatePayoffTimeline';

// Sample debt data for consistent testing
const GOLDEN_DEBT_FIXTURES = [
  {
    id: 'credit_card_1',
    name: 'Credit Card',
    amount_cents: 250000, // £2,500
    apr_bps: 1999,        // 19.99%
    min_payment_cents: 7500, // £75
  },
  {
    id: 'loan_1', 
    name: 'Personal Loan',
    amount_cents: 1500000, // £15,000
    apr_bps: 899,          // 8.99%
    min_payment_cents: 35000, // £350
  },
  {
    id: 'overdraft_1',
    name: 'Overdraft',
    amount_cents: 50000,   // £500
    apr_bps: 3999,         // 39.99%
    min_payment_cents: 1000, // £10
  }
];

const GOLDEN_STRATEGY_PARAMS = {
  extraPayment: 10000, // £100 extra per month
  totalPayment: 54500, // £75+£350+£10 min + £100 extra = £545
  startDate: new Date('2024-01-01'),
};

describe('Golden Master Snapshots', () => {

  describe('Debt Normalization Snapshots', () => {
    test('normalized debt structure remains consistent', () => {
      const result = safeNormalizeDebts([...GOLDEN_DEBT_FIXTURES]);
      
      // Golden master snapshot - any change here indicates potential regression
      expect(result).toMatchSnapshot();
      
      // Specific structural invariants that must hold
      expect(result).toHaveLength(3);
      expect(result.every(debt => debt.amount_cents >= 0)).toBe(true);
      expect(result.every(debt => debt.apr_bps >= 0 && debt.apr_bps <= 100_000)).toBe(true);
      expect(result.every(debt => Number.isFinite(debt.min_payment_cents))).toBe(true);
    });

    test('corrupted data normalization is stable', () => {
      const corruptedDebts = [
        {
          id: 'corrupt_1',
          name: '',  // Empty name
          balance: 'NaN',  // Old field, invalid value
          interestRate: 'invalid%',  // Old field, invalid value
          minPayment: -50,  // Invalid negative
        },
        {
          id: 'corrupt_2',
          name: 'Valid Name',
          amount_cents: Infinity,  // Invalid amount
          apr_bps: -100,  // Invalid APR
          min_payment_cents: null,  // Invalid payment
        },
        null,  // Null entry
        undefined,  // Undefined entry
      ];

      const result = safeNormalizeDebts(corruptedDebts);
      
      // Should consistently filter and normalize corrupted data
      expect(result).toMatchSnapshot();
      
      // Only valid entries should remain
      expect(result.length).toBeLessThan(corruptedDebts.length);
      expect(result.every(debt => debt !== null && debt !== undefined)).toBe(true);
    });
  });

  describe('Timeline Generation Snapshots', () => {
    test('payoff timeline is consistent', () => {
      const timeline = generatePayoffTimeline(
        GOLDEN_DEBT_FIXTURES,
        GOLDEN_STRATEGY_PARAMS.totalPayment
      );

      // Timeline structure should remain consistent
      expect(timeline).toMatchSnapshot();

      // Key timeline invariants
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0].totalDebt).toBeGreaterThan(timeline[timeline.length - 1].totalDebt);
      expect(timeline[timeline.length - 1].totalDebt).toBe(0);
    });

    test('different total payment amounts produce expected variations', () => {
      const minPayments = 43500; // £435 minimum payments
      const totalPayments = [minPayments, minPayments + 5000, minPayments + 10000, minPayments + 20000]; // +£0, +£50, +£100, +£200
      
      const timelines = totalPayments.map(totalPayment => 
        generatePayoffTimeline(GOLDEN_DEBT_FIXTURES, totalPayment)
      );

      // Higher total payments should result in shorter timelines
      const timelineLengths = timelines.map(t => t.length);
      expect(timelineLengths[0]).toBeGreaterThan(timelineLengths[1]); // No extra > £50 extra
      expect(timelineLengths[1]).toBeGreaterThan(timelineLengths[2]); // £50 > £100 extra
      expect(timelineLengths[2]).toBeGreaterThan(timelineLengths[3]); // £100 > £200 extra

      // Snapshot the length progression for regression detection
      expect(timelineLengths).toMatchSnapshot();
    });
  });

  describe('Financial Calculation Snapshots', () => {
    test('total debt and payment calculations are stable', () => {
      const debts = safeNormalizeDebts([...GOLDEN_DEBT_FIXTURES]);
      
      const totals = {
        totalDebt: debts.reduce((sum, debt) => sum + debt.amount_cents, 0),
        totalMinPayments: debts.reduce((sum, debt) => sum + debt.min_payment_cents, 0),
        avgAPR: debts.reduce((sum, debt) => sum + debt.apr_bps, 0) / debts.length,
        weightedAPR: debts.reduce((sum, debt) => 
          sum + (debt.apr_bps * debt.amount_cents), 0
        ) / debts.reduce((sum, debt) => sum + debt.amount_cents, 0),
      };

      // Financial calculations should remain consistent
      expect(totals).toMatchSnapshot();
      
      // Sanity checks
      expect(totals.totalDebt).toBe(250000 + 1500000 + 50000); // £18,000
      expect(totals.totalMinPayments).toBe(7500 + 35000 + 1000); // £435
    });

    test('interest calculations over time are stable', () => {
      const debt = GOLDEN_DEBT_FIXTURES[0]; // Credit card
      const monthlyRate = debt.apr_bps / (100 * 12); // Convert BPS to monthly decimal
      
      // Simulate 12 months of payments
      const interestSchedule = [];
      let balance = debt.amount_cents;
      
      for (let month = 1; month <= 12; month++) {
        const interestCharge = Math.round(balance * monthlyRate / 100);
        const principalPayment = debt.min_payment_cents - interestCharge;
        balance = Math.max(0, balance - principalPayment);
        
        interestSchedule.push({
          month,
          balance,
          interestCharge,
          principalPayment,
        });
        
        if (balance === 0) break;
      }

      // Interest calculations should be deterministic
      expect(interestSchedule).toMatchSnapshot();
      
      // Should show decreasing balance (if min payments > interest)
      expect(interestSchedule[0].balance).toBeGreaterThan(
        interestSchedule[interestSchedule.length - 1].balance
      );
    });
  });

  describe('Edge Case Snapshots', () => {
    test('single debt scenarios are handled consistently', () => {
      const singleDebt = [GOLDEN_DEBT_FIXTURES[0]];
      const totalPayment = 12500; // £75 min + £50 extra = £125
      const timeline = generatePayoffTimeline(singleDebt, totalPayment);

      expect(timeline).toMatchSnapshot();

      // Single debt should be paid off completely
      expect(timeline[timeline.length - 1].totalDebt).toBe(0);
    });

    test('minimum payment scenarios are stable', () => {
      const minPayments = 43500; // £435 minimum payments only
      const timeline = generatePayoffTimeline(GOLDEN_DEBT_FIXTURES, minPayments);

      expect(timeline).toMatchSnapshot();

      // Should still reach zero eventually (assuming min payments > interest)
      expect(timeline[timeline.length - 1].totalDebt).toBe(0);
    });

    test('high APR debt scenarios produce expected outcomes', () => {
      const highAPRDebt = {
        id: 'payday_loan',
        name: 'Payday Loan',
        amount_cents: 100000, // £1,000
        apr_bps: 50000,       // 500% APR (extreme but realistic for payday loans)
        min_payment_cents: 5000, // £50
      };

      const totalPayment = 15000; // £50 min + £100 extra = £150
      const timeline = generatePayoffTimeline([highAPRDebt], totalPayment);

      // Should still converge (with sufficient extra payment)
      expect(timeline).toMatchSnapshot();

      // Verify it reaches zero (critical for high APR scenarios)
      expect(timeline[timeline.length - 1].totalDebt).toBe(0);
    });
  });

  describe('Data Format Consistency', () => {
    test('all monetary values remain in cents', () => {
      const debts = safeNormalizeDebts([...GOLDEN_DEBT_FIXTURES]);
      const timeline = generatePayoffTimeline(debts, GOLDEN_STRATEGY_PARAMS.totalPayment);

      // All amounts should be integers (cents)
      debts.forEach(debt => {
        expect(Number.isInteger(debt.amount_cents)).toBe(true);
        expect(Number.isInteger(debt.min_payment_cents)).toBe(true);
      });

      timeline.forEach(entry => {
        if ('totalDebt' in entry) {
          expect(Number.isFinite(entry.totalDebt)).toBe(true);
        }
        if ('interestPaid' in entry) {
          expect(Number.isFinite(entry.interestPaid)).toBe(true);
        }
        if ('principalPaid' in entry) {
          expect(Number.isFinite(entry.principalPaid)).toBe(true);
        }
      });
    });

    test('all APR values remain in basis points', () => {
      const debts = safeNormalizeDebts([...GOLDEN_DEBT_FIXTURES]);

      debts.forEach(debt => {
        expect(Number.isInteger(debt.apr_bps)).toBe(true);
        expect(debt.apr_bps).toBeGreaterThanOrEqual(0);
        expect(debt.apr_bps).toBeLessThanOrEqual(100_000); // Max 1000% APR
      });
    });
  });

  describe('Performance Baseline Snapshots', () => {
    test('large debt list performance is stable', () => {
      // Generate 100 debts for performance testing
      const largeDebtList = Array.from({ length: 100 }, (_, i) => ({
        id: `debt_${i}`,
        name: `Debt ${i}`,
        amount_cents: 10000 + (i * 1000),
        apr_bps: 1000 + (i * 10),
        min_payment_cents: 500 + (i * 5),
      }));

      const totalPayment = 60000; // £600 total payment for large debt list
      const startTime = process.hrtime.bigint();
      const timeline = generatePayoffTimeline(largeDebtList, totalPayment);
      const endTime = process.hrtime.bigint();
      
      const durationMs = Number(endTime - startTime) / 1_000_000;

      // Performance should be reasonable (adjust threshold as needed)
      expect(durationMs).toBeLessThan(1000); // Less than 1 second
      
      // Timeline should still be valid
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[timeline.length - 1].remainingDebt).toBe(0);

      // Snapshot the performance characteristics
      expect({
        debtCount: largeDebtList.length,
        timelineLength: timeline.length,
        durationMs: Math.round(durationMs),
      }).toMatchSnapshot();
    });
  });
});