/**
 * Clean UK Debt Validation - GPT Spec Implementation
 * Fail fast, no magic, minimal but strict
 */

import { CreateUKDebt, UpdateUKDebt } from '../types/UKDebt';

export function validateDebt(data: any): string[] {
  const errors: string[] = [];

  if (typeof data.amount !== "number" || data.amount < 0) {
    errors.push("amount must be a non-negative number");
  }

  if (typeof data.apr !== "number" || data.apr < 0 || data.apr > 100) {
    errors.push("apr must be between 0 and 100");
  }

  if (typeof data.min_payment !== "number" || data.min_payment < 0) {
    errors.push("min_payment must be non-negative");
  }

  if (data.debt_type && typeof data.debt_type !== "string") {
    errors.push("debt_type must be a string");
  }

  if (data.order_index !== undefined && !Number.isInteger(data.order_index)) {
    errors.push("order_index must be an integer");
  }

  if (data.original_amount !== null && data.original_amount !== undefined) {
    if (typeof data.original_amount !== "number" || data.original_amount < 0) {
      errors.push("original_amount must be a non-negative number");
    }
  }

  if (data.debt_limit !== null && data.debt_limit !== undefined) {
    if (typeof data.debt_limit !== "number" || data.debt_limit < 0) {
      errors.push("debt_limit must be a non-negative number");
    }
  }

  return errors;
}

export function validateCreateDebt(data: CreateUKDebt): string[] {
  const errors = validateDebt(data);

  if (!data.name || data.name.trim() === '') {
    errors.push("name is required");
  }

  return errors;
}

export function validateUpdateDebt(data: UpdateUKDebt): string[] {
  return validateDebt(data);
}