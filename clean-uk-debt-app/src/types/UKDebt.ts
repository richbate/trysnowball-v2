/**
 * Clean UK Debt Types - Zero Conversion Bullshit
 * Matches D1 database schema exactly
 * GPT spec implementation - bulletproof and boring
 */

export interface UKDebt {
  id: string;
  user_id: string;
  name: string | null;
  amount: number;                   // £1234.56
  original_amount: number | null;   // £5000.00 (optional)
  apr: number;                      // 19.9%
  min_payment: number;             // £45.00
  debt_limit: number | null;       // £5000.00 (optional)
  debt_type: string;               // 'credit_card', 'loan', 'other'
  order_index: number;             // 0, 1, 2...
  created_at: string;              // ISO 8601
  updated_at: string;              // ISO 8601
}

export interface CreateUKDebt {
  name: string;
  amount: number;
  original_amount?: number | null;
  apr: number;
  min_payment: number;
  debt_limit?: number | null;
  debt_type: string;
  order_index: number;
}

export interface UpdateUKDebt {
  name?: string;
  amount?: number;
  original_amount?: number | null;
  apr?: number;
  min_payment?: number;
  debt_limit?: number | null;
  debt_type?: string;
  order_index?: number;
}