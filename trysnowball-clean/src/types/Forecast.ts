/**
 * CP-4 Forecast Engine Types
 * Traditional snowball simulation with UK debt format
 */

import { UKDebt } from './UKDebt';

export interface PlanResult {
  month: number;
  debts: DebtSnapshot[];
  totalBalance: number;
  totalInterest: number;
  totalPrincipal: number;
  snowballAmount: number; // Extra payment applied this month
}

export interface DebtSnapshot {
  id: string;
  name: string;
  startingBalance: number;
  interestCharged: number;
  principalPaid: number;
  snowballApplied: number;
  endingBalance: number;
  isPaidOff: boolean;
}

export interface ForecastSummary {
  totalMonths: number;
  debtFreeDate: string; // Human readable: "March 2026"
  totalInterestPaid: number;
  interestSavedVsMinimum: number;
  firstDebtClearedMonth: number;
  milestoneDates: MilestoneDate[];
  simulationEngine?: 'standard' | 'v2-composite'; // Track which engine was used
  bucketDetails?: BucketSummary; // Additional details for composite mode
}

export interface BucketSummary {
  totalBucketsCleared: number;
  bucketMilestones: BucketMilestone[];
  highestAPRCleared: { name: string; apr: number; monthCleared: number };
  totalBucketsAtStart: number;
}

export interface MilestoneDate {
  debtName: string;
  monthCleared: number;
  dateCleared: string; // "January 2025"
}

export interface BucketMilestone {
  bucketName: string;
  debtName: string;
  clearedIn: string; // "Feb 2025"
  monthCleared: number;
  totalInterestPaid: number;
  apr: number;
}

export interface SimulationInput {
  debts: UKDebt[];
  extraPerMonth: number;
  startDate?: Date; // Default: today
}