/**
 * Clean UK Debt Type - Matches D1 Database Schema Exactly
 * No conversions, no magic, no American nonsense
 */

export interface UKDebt {
  id: string;
  user_id: string;
  name: string | null;              // Optional but nullable
  amount: number;                   // Current balance in pounds (e.g. 1234.56)
  original_amount: number | null;   // Optional: Original balance
  apr: number;                      // As % (e.g. 19.9)
  min_payment: number;             // Monthly minimum payment (£)
  debt_limit: number | null;       // Optional: credit limit (£)
  debt_type: string;               // e.g. 'credit_card'
  order_index: number;             // e.g. 0 = first to pay off
  created_at: string;              // ISO 8601 timestamp
  updated_at: string;              // ISO 8601 timestamp
}

/**
 * For creating new debts (no ID, timestamps, user_id)
 */
export interface CreateUKDebt {
  name: string | null;
  amount: number;
  original_amount?: number | null;
  apr: number;
  min_payment: number;
  debt_limit?: number | null;
  debt_type: string;
  order_index: number;
}

/**
 * For updating existing debts (all fields optional)
 */
export interface UpdateUKDebt {
  name?: string | null;
  amount?: number;
  original_amount?: number | null;
  apr?: number;
  min_payment?: number;
  debt_limit?: number | null;
  debt_type?: string;
  order_index?: number;
}