/**
 * Try Snowball Database Types
 * Comprehensive type definitions for debt tracking and progress monitoring
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type DebtType = 'credit_card' | 'overdraft' | 'personal_loan' | 'car_finance' | 'store_card' | 'payday_loan' | 'other';

export type FocusArea = 'building_emergency_fund' | 'paying_minimum_only' | 'snowball_method' | 'avalanche_method' | 'debt_consolidation' | 'budget_optimization';

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Debts Table - Static details of each debt
 */
export interface Debt {
  userId: string;
  debtId: string;
  name: string; // e.g. "Barclaycard Platinum"
  type: DebtType;
  limit: number; // Credit limit or original loan amount
  interestRate: number; // Annual percentage rate
  minPayment: number; // Minimum monthly payment
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  isActive: boolean; // Whether debt is still being tracked
  notes?: string; // Optional user notes
}

/**
 * DebtSnapshots Table - One row per month per debt, tracking progress over time
 */
export interface DebtSnapshot {
  userId: string;
  debtId: string;
  month: string; // Format: YYYY-MM
  balance: number; // Outstanding balance at end of month
  extraPayment?: number; // Any extra payment made this month
  autoMinPayment: boolean; // Whether minimum payment was made automatically
  actualPayment: number; // Total payment made this month (min + extra)
  interestCharged: number; // Interest charged this month
  recordedAt: string; // When this snapshot was recorded (ISO date)
  notes?: string; // Optional notes for this month
}

/**
 * UserProgress Table - Aggregate user progress for each month
 */
export interface UserProgress {
  userId: string;
  month: string; // Format: YYYY-MM
  totalBalance: number; // Sum of all debt balances
  totalPaid: number; // Total amount paid across all debts this month
  totalInterestCharged: number; // Total interest charged this month
  streakNoNewDebt: number; // Consecutive months without new debt
  streakNoWastedSpend: number; // Consecutive months staying on budget
  mainFocus: FocusArea; // Current debt strategy focus
  netWorthChange: number; // Change in net worth this month
  recordedAt: string; // ISO date string
  milestones?: string[]; // Array of milestone IDs achieved this month
}

// ============================================================================
// SUPPORTING TABLES
// ============================================================================

/**
 * Users Table - Basic user information
 */
export interface User {
  userId: string;
  email?: string;
  displayName?: string;
  createdAt: string;
  lastActiveAt: string;
  preferences: {
    currency: 'GBP' | 'USD' | 'EUR';
    paymentDay: number; // Day of month for payments (1-31)
    reminderEnabled: boolean;
    dataRetentionMonths: number;
  };
}

/**
 * Milestones Table - Achievement tracking
 */
export interface Milestone {
  milestoneId: string;
  userId: string;
  type: 'debt_paid_off' | 'streak_achievement' | 'balance_reduction' | 'emergency_fund' | 'custom';
  title: string;
  description: string;
  achievedAt: string; // ISO date string
  value?: number; // Associated value (e.g., amount paid off)
  debtId?: string; // Associated debt if relevant
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

export const sampleUser: User = {
  userId: "user_123456",
  email: "rich@trysnowball.co.uk",
  displayName: "Rich",
  createdAt: "2024-01-15T09:00:00.000Z",
  lastActiveAt: "2024-07-24T14:30:00.000Z",
  preferences: {
    currency: "GBP",
    paymentDay: 15,
    reminderEnabled: true,
    dataRetentionMonths: 60
  }
};

export const sampleDebts: Debt[] = [
  {
    userId: "user_123456",
    debtId: "debt_barclaycard_001",
    name: "Barclaycard Platinum",
    type: "credit_card",
    limit: 8000,
    interestRate: 23.9,
    minPayment: 160,
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-07-20T10:30:00.000Z",
    isActive: true,
    notes: "Main credit card, used for everything"
  },
  {
    userId: "user_123456",
    debtId: "debt_halifax_overdraft_001",
    name: "Halifax Current Account Overdraft",
    type: "overdraft",
    limit: 2500,
    interestRate: 39.9,
    minPayment: 0,
    createdAt: "2024-01-15T09:00:00.000Z",
    updatedAt: "2024-07-20T10:30:00.000Z",
    isActive: true,
    notes: "Graduate overdraft, needs to go first"
  },
  {
    userId: "user_123456",  
    debtId: "debt_mbna_card_001",
    name: "MBNA Credit Card",
    type: "credit_card",
    limit: 4500,
    interestRate: 28.9,
    minPayment: 90,
    createdAt: "2024-02-01T12:00:00.000Z",
    updatedAt: "2024-07-20T10:30:00.000Z",
    isActive: true,
    notes: "0% balance transfer ended in March"
  },
  {
    userId: "user_123456",
    debtId: "debt_tesco_clubcard_001", 
    name: "Tesco Clubcard Credit Card",
    type: "store_card",
    limit: 1200,
    interestRate: 34.9,
    minPayment: 25,
    createdAt: "2024-03-10T15:30:00.000Z",
    updatedAt: "2024-07-20T10:30:00.000Z",
    isActive: true,
    notes: "Only use for groceries to get points"
  },
  {
    userId: "user_123456",
    debtId: "debt_car_finance_001",
    name: "Honda Civic Finance",
    type: "car_finance", 
    limit: 18000,
    interestRate: 4.9,
    minPayment: 299,
    createdAt: "2023-11-20T14:00:00.000Z",
    updatedAt: "2024-07-20T10:30:00.000Z",
    isActive: true,
    notes: "3 years left, low rate so paying minimum"
  }
];

export const sampleSnapshots: DebtSnapshot[] = [
  // Barclaycard - January 2024
  {
    userId: "user_123456",
    debtId: "debt_barclaycard_001", 
    month: "2024-01",
    balance: 7200,
    extraPayment: 0,
    autoMinPayment: true,
    actualPayment: 160,
    interestCharged: 143.80,
    recordedAt: "2024-01-31T23:59:00.000Z",
    notes: "Starting balance"
  },
  // Barclaycard - February 2024
  {
    userId: "user_123456",
    debtId: "debt_barclaycard_001",
    month: "2024-02", 
    balance: 7050,
    extraPayment: 100,
    autoMinPayment: true,
    actualPayment: 260,
    interestCharged: 140.25,
    recordedAt: "2024-02-29T23:59:00.000Z",
    notes: "Started extra payments"
  },
  // Halifax Overdraft - January 2024
  {
    userId: "user_123456",
    debtId: "debt_halifax_overdraft_001",
    month: "2024-01",
    balance: 1800,
    extraPayment: 200,
    autoMinPayment: false,
    actualPayment: 200,
    interestCharged: 59.70,
    recordedAt: "2024-01-31T23:59:00.000Z",
    notes: "Focusing on this first - highest rate"
  },
  // Halifax Overdraft - February 2024
  {
    userId: "user_123456", 
    debtId: "debt_halifax_overdraft_001",
    month: "2024-02",
    balance: 1500,
    extraPayment: 300,
    autoMinPayment: false,
    actualPayment: 300,
    interestCharged: 49.75,
    recordedAt: "2024-02-29T23:59:00.000Z",
    notes: "Extra from tax refund"
  },
  // MBNA Card - February 2024 (just opened)
  {
    userId: "user_123456",
    debtId: "debt_mbna_card_001",
    month: "2024-02",
    balance: 2800,
    extraPayment: 0,
    autoMinPayment: true,  
    actualPayment: 90,
    interestCharged: 0, // 0% period
    recordedAt: "2024-02-29T23:59:00.000Z",
    notes: "Balance transfer from old card"
  },
  // Tesco Card - March 2024 (just opened)
  {
    userId: "user_123456",
    debtId: "debt_tesco_clubcard_001",
    month: "2024-03",
    balance: 450,
    extraPayment: 0,
    autoMinPayment: true,
    actualPayment: 25,
    interestCharged: 13.12,
    recordedAt: "2024-03-31T23:59:00.000Z", 
    notes: "Grocery spending this month"
  }
];

export const sampleUserProgress: UserProgress[] = [
  {
    userId: "user_123456",
    month: "2024-01",
    totalBalance: 28200,
    totalPaid: 858,
    totalInterestCharged: 203.50,
    streakNoNewDebt: 1,
    streakNoWastedSpend: 0,
    mainFocus: "building_emergency_fund",
    netWorthChange: -654.50,
    recordedAt: "2024-01-31T23:59:00.000Z",
    milestones: []
  },
  {
    userId: "user_123456", 
    month: "2024-02",
    totalBalance: 26850,
    totalPaid: 1149,
    totalInterestCharged: 189.50,
    streakNoNewDebt: 0, // Opened MBNA card
    streakNoWastedSpend: 1,
    mainFocus: "snowball_method",
    netWorthChange: -959.50,
    recordedAt: "2024-02-29T23:59:00.000Z",
    milestones: ["milestone_first_extra_payment"]
  },
  {
    userId: "user_123456",
    month: "2024-03", 
    totalBalance: 25950,
    totalPaid: 1064,
    totalInterestCharged: 164.12,
    streakNoNewDebt: 0, // Opened Tesco card
    streakNoWastedSpend: 2,
    mainFocus: "snowball_method", 
    netWorthChange: -899.88,
    recordedAt: "2024-03-31T23:59:00.000Z",
    milestones: []
  }
];

export const sampleMilestones: Milestone[] = [
  {
    milestoneId: "milestone_first_extra_payment",
    userId: "user_123456",
    type: "custom",
    title: "First Extra Payment! 🎉",
    description: "Made your first extra payment of £100 toward debt payoff",
    achievedAt: "2024-02-15T10:30:00.000Z",
    value: 100,
    debtId: "debt_barclaycard_001"
  },
  {
    milestoneId: "milestone_overdraft_half_gone",
    userId: "user_123456", 
    type: "balance_reduction",
    title: "Overdraft Half Cleared! 💪",
    description: "Reduced your overdraft by 50% - from £1800 to £900",
    achievedAt: "2024-04-30T23:59:00.000Z",
    value: 900,
    debtId: "debt_halifax_overdraft_001"
  }
];

// ============================================================================
// HELPER FUNCTIONS AND UTILITIES  
// ============================================================================

/**
 * Generate month key for current month + offset
 */
export const getMonthKey = (monthOffset: number = 0): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calculate total debt balance for a user in a specific month
 */
export const calculateTotalBalance = (snapshots: DebtSnapshot[], userId: string, month: string): number => {
  return snapshots
    .filter(s => s.userId === userId && s.month === month)
    .reduce((total, snapshot) => total + snapshot.balance, 0);
};

/**
 * Get active debts for a user
 */
export const getActiveDebts = (debts: Debt[], userId: string): Debt[] => {
  return debts.filter(debt => debt.userId === userId && debt.isActive);
};

/**
 * Get latest snapshot for each debt
 */
export const getLatestSnapshots = (snapshots: DebtSnapshot[], userId: string): DebtSnapshot[] => {
  const debtGroups = snapshots
    .filter(s => s.userId === userId)
    .reduce((groups, snapshot) => {
      const key = snapshot.debtId;
      if (!groups[key] || snapshot.month > groups[key].month) {
        groups[key] = snapshot;
      }
      return groups;
    }, {} as Record<string, DebtSnapshot>);
  
  return Object.values(debtGroups);
};