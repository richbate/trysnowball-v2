/**
 * CP-3 Analytics Privacy Enforcement Tests
 * Ensures no raw debt values leak into analytics payloads
 * Prevents accidental privacy violations in future development
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateAnalyticsMetadata, 
  validateAnalyticsPayload, 
  generateFrontendAnalyticsEvent 
} from '../src/metadata.js';

describe('CP-3 Analytics Privacy Enforcement', () => {
  const sampleDebt = {
    name: 'Chase Freedom Card',
    amount: 2500.75,
    apr: 18.9,
    min_payment: 75.50,
    debt_type: 'credit_card'
  };

  describe('Metadata Generation', () => {
    it('should only generate bucketed metadata, never raw values', () => {
      const metadata = calculateAnalyticsMetadata(sampleDebt);
      
      // Should have safe bucketed values
      expect(metadata).toEqual({
        amount_range: '1k_5k',      // Not 2500.75
        apr_range: 'medium_10_20',  // Not 18.9
        payment_burden: 'heavy',    // Not 75.50
        category: 'credit_card',
        created_month: expect.stringMatching(/^\d{4}-\d{2}$/),
        payoff_quarter: expect.stringMatching(/^\d{4}-Q[1-4]$/)
      });
      
      // Should never contain raw values
      expect(Object.values(metadata)).not.toContain(sampleDebt.name);
      expect(Object.values(metadata)).not.toContain(sampleDebt.amount);
      expect(Object.values(metadata)).not.toContain(sampleDebt.apr);
      expect(Object.values(metadata)).not.toContain(sampleDebt.min_payment);
    });

    it('should use exact bucket ranges from privacy spec', () => {
      // Test amount range boundaries
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount: 999 }).amount_range).toBe('under_1k');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount: 1000 }).amount_range).toBe('1k_5k');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount: 4999 }).amount_range).toBe('1k_5k');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount: 5000 }).amount_range).toBe('5k_10k');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount: 10000 }).amount_range).toBe('10k_plus');
      
      // Test APR range boundaries
      expect(calculateAnalyticsMetadata({ ...sampleDebt, apr: 9.9 }).apr_range).toBe('low_0_10');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, apr: 10 }).apr_range).toBe('medium_10_20');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, apr: 19.9 }).apr_range).toBe('medium_10_20');
      expect(calculateAnalyticsMetadata({ ...sampleDebt, apr: 20 }).apr_range).toBe('high_20_plus');
      
      // Test payment burden boundaries
      const amount = 1000;
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount, min_payment: 19 }).payment_burden).toBe('light');    // 1.9%
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount, min_payment: 20 }).payment_burden).toBe('moderate'); // 2.0%
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount, min_payment: 39 }).payment_burden).toBe('moderate'); // 3.9%
      expect(calculateAnalyticsMetadata({ ...sampleDebt, amount, min_payment: 40 }).payment_burden).toBe('heavy');    // 4.0%
    });
  });

  describe('Privacy Validation', () => {
    it('should reject payloads with forbidden field names', () => {
      const badPayloads = [
        { name: 'Chase Card', amount_range: '1k_5k' },
        { amount: 2500, apr_range: 'medium_10_20' },
        { apr: 18.9, category: 'credit_card' },
        { min_payment: 75, payment_burden: 'heavy' },
        { user_id: 'user_123', amount_range: '1k_5k' },
        { email: 'user@example.com', category: 'loan' },
        { id: 'debt_123', apr_range: 'low_0_10' }
      ];
      
      badPayloads.forEach(payload => {
        expect(() => validateAnalyticsPayload(payload))
          .toThrow(/Privacy violation: Forbidden field/);
      });
    });

    it('should reject payloads with suspicious numeric values', () => {
      const suspiciousPayloads = [
        { suspicious_amount: 2500 },     // Looks like raw amount
        { suspicious_apr: 18.9 },        // Looks like raw APR
        { suspicious_payment: 75.50 }    // Looks like raw payment
      ];
      
      suspiciousPayloads.forEach(payload => {
        expect(() => validateAnalyticsPayload(payload))
          .toThrow(/Privacy violation: Suspicious value/);
      });
    });

    it('should reject payloads with exact dates (only month/quarter allowed)', () => {
      const badDatePayloads = [
        { exact_date: '2024-09-11' },           // Exact date forbidden
        { created_at: '2024-09-11T10:30:00Z' } // Timestamp forbidden
      ];
      
      badDatePayloads.forEach(payload => {
        expect(() => validateAnalyticsPayload(payload))
          .toThrow(/Privacy violation: Suspicious value/);
      });
    });

    it('should accept safe bucketed payloads', () => {
      const safePayloads = [
        {
          amount_range: '1k_5k',
          apr_range: 'medium_10_20',
          payment_burden: 'heavy',
          category: 'credit_card',
          created_month: '2024-09',
          payoff_quarter: '2025-Q2'
        },
        {
          event: 'debt_created',
          properties: {
            amount_range: 'under_1k',
            apr_range: 'low_0_10',
            has_goals: false,
            user_tier: 'free'
          }
        }
      ];
      
      safePayloads.forEach(payload => {
        expect(() => validateAnalyticsPayload(payload)).not.toThrow();
      });
    });
  });

  describe('Frontend Event Generation', () => {
    it('should generate safe frontend analytics events', () => {
      const event = generateFrontendAnalyticsEvent('debt_created', sampleDebt);
      
      expect(event.event).toBe('debt_created');
      expect(event.properties).toMatchObject({
        amount_range: '1k_5k',
        apr_range: 'medium_10_20',
        payment_burden: 'heavy',
        category: 'credit_card',
        created_month: expect.stringMatching(/^\d{4}-\d{2}$/),
        estimated_payoff_months: expect.any(Number),
        has_buckets: false,
        has_goals: false,
        user_tier: 'free'
      });
      
      // Validate that generated event passes privacy checks
      expect(() => validateAnalyticsPayload(event)).not.toThrow();
    });

    it('should never include raw debt values in frontend events', () => {
      const event = generateFrontendAnalyticsEvent('debt_updated', sampleDebt);
      const eventString = JSON.stringify(event);
      
      // Ensure no raw values leak into the event
      expect(eventString).not.toContain('Chase Freedom Card');
      expect(eventString).not.toContain('2500.75');
      expect(eventString).not.toContain('18.9');
      expect(eventString).not.toContain('75.50');
    });
  });

  describe('Category Normalization', () => {
    it('should normalize debt types to safe categories', () => {
      const testCases = [
        { input: 'Credit Card', expected: 'credit_card' },
        { input: 'VISA Card', expected: 'credit_card' },
        { input: 'Personal Loan', expected: 'loan' },
        { input: 'Student Loan', expected: 'loan' },
        { input: 'Home Mortgage', expected: 'mortgage' },
        { input: 'Random Debt!@#', expected: 'other' },
        { input: 'undefined', expected: 'other' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const metadata = calculateAnalyticsMetadata({
          ...sampleDebt,
          debt_type: input
        });
        expect(metadata.category).toBe(expected);
      });
    });
  });

  describe('Bucket Consistency', () => {
    it('should generate consistent buckets across multiple calls', () => {
      const debt = { ...sampleDebt };
      
      const metadata1 = calculateAnalyticsMetadata(debt);
      const metadata2 = calculateAnalyticsMetadata(debt);
      
      expect(metadata1.amount_range).toBe(metadata2.amount_range);
      expect(metadata1.apr_range).toBe(metadata2.apr_range);
      expect(metadata1.payment_burden).toBe(metadata2.payment_burden);
      expect(metadata1.category).toBe(metadata2.category);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero and negative values safely', () => {
      const edgeCaseDebt = {
        ...sampleDebt,
        amount: 0,
        min_payment: 0,
        apr: 0
      };
      
      const metadata = calculateAnalyticsMetadata(edgeCaseDebt);
      
      expect(metadata.amount_range).toBe('under_1k');
      expect(metadata.apr_range).toBe('low_0_10');
      expect(metadata.payment_burden).toBe('light'); // 0/0 handled gracefully
      
      // Should still pass privacy validation
      expect(() => validateAnalyticsPayload(metadata)).not.toThrow();
    });

    it('should handle very large values safely', () => {
      const largeDebt = {
        ...sampleDebt,
        amount: 999999,
        apr: 99.9,
        min_payment: 50000
      };
      
      const metadata = calculateAnalyticsMetadata(largeDebt);
      
      expect(metadata.amount_range).toBe('10k_plus');
      expect(metadata.apr_range).toBe('high_20_plus');
      expect(metadata.payment_burden).toBe('heavy');
      
      // Should still pass privacy validation
      expect(() => validateAnalyticsPayload(metadata)).not.toThrow();
    });
  });
});

describe('Privacy Spec Compliance', () => {
  it('should only use bucket values defined in CP-3_ANALYTICS_PRIVACY.md', () => {
    // These are the ONLY allowed values per the privacy spec
    const allowedAmountRanges = ['under_1k', '1k_5k', '5k_10k', '10k_plus'];
    const allowedAprRanges = ['low_0_10', 'medium_10_20', 'high_20_plus'];
    const allowedPaymentBurdens = ['light', 'moderate', 'heavy'];
    const allowedCategories = ['credit_card', 'loan', 'mortgage', 'other'];
    
    // Test many random debt values
    for (let i = 0; i < 100; i++) {
      const randomDebt = {
        name: `Random Debt ${i}`,
        amount: Math.random() * 100000,
        apr: Math.random() * 50,
        min_payment: Math.random() * 1000,
        debt_type: ['credit_card', 'loan', 'mortgage', 'other'][Math.floor(Math.random() * 4)]
      };
      
      const metadata = calculateAnalyticsMetadata(randomDebt);
      
      expect(allowedAmountRanges).toContain(metadata.amount_range);
      expect(allowedAprRanges).toContain(metadata.apr_range);
      expect(allowedPaymentBurdens).toContain(metadata.payment_burden);
      expect(allowedCategories).toContain(metadata.category);
      expect(metadata.created_month).toMatch(/^\d{4}-\d{2}$/);
      expect(metadata.payoff_quarter).toMatch(/^\d{4}-Q[1-4]$/);
    }
  });
});