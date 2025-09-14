/**
 * Clean UK Debt Validation - Fail Fast, No Magic
 * Based on GPT spec - minimal but strict
 */

import { CreateUKDebt, UpdateUKDebt } from '../types/CleanUKDebt';

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

  // Optional field validation
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

  // Required fields for creation
  if (!data.name || data.name.trim() === '') {
    errors.push("name is required");
  }

  return errors;
}

export function validateUpdateDebt(data: UpdateUKDebt): string[] {
  // For updates, all fields are optional, just validate what's provided
  return validateDebt(data);
}