/**
 * Core debt data types for the application
 * Single source of truth for debt structure
 */

export interface Debt {
  // Core identifiers
  id: string;
  name: string;
  type: DebtType;
  
  // Financial data
  balance: number;
  originalAmount: number;
  interestRate: number; // Annual percentage rate
  minPayment: number;
  
  // Metadata
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  order: number; // For custom sorting
  
  // Optional fields
  isDemo?: boolean;
  notes?: string;
  accountNumber?: string; // Last 4 digits only
  dueDate?: number; // Day of month (1-31)
  creditLimit?: number; // For credit cards
}

export type DebtType = 
  | 'Credit Card'
  | 'Personal Loan'
  | 'Store Card'
  | 'Overdraft'
  | 'Car Loan'
  | 'Student Loan'
  | 'Mortgage'
  | 'Other';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string; // ISO 8601
  month: string; // Format: "2024-01"
  type: 'minimum' | 'extra' | 'snowball';
  createdAt: string;
}

export interface DebtSnapshot {
  debtId: string;
  balance: number;
  timestamp: string; // ISO 8601
  eventType: 'payment' | 'adjustment' | 'interest';
}

export interface MigrationMeta {
  key: string;
  value: any;
  updatedAt: string;
}

// Legacy data structures for migration
export interface LegacyDebt {
  id?: string;
  name?: string;
  balance?: number | string;
  amount?: number | string; // Sometimes used instead of balance
  rate?: number | string;
  interestRate?: number | string;
  interest?: number | string; // Another variant
  minPayment?: number | string;
  min?: number | string; // Short form
  regularPayment?: number | string; // Yet another variant
  type?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
  originalAmount?: number | string;
  isDemo?: boolean;
}

// Validation helpers
export const isValidDebt = (debt: any): debt is Debt => {
  return (
    typeof debt === 'object' &&
    typeof debt.id === 'string' &&
    typeof debt.name === 'string' &&
    typeof debt.balance === 'number' &&
    typeof debt.interestRate === 'number' &&
    typeof debt.minPayment === 'number'
  );
};

export const normalizeAmount = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};