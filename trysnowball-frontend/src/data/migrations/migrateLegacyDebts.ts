/**
 * One-time background migration to normalize legacy debt data
 * Non-destructive - keeps IDs and timestamps, just rewrites shape
 */

import { normalizeDebt, type Debt } from '../../utils/safeDebtNormalizer';
import { localDebtStore } from '../localDebtStore';

export async function migrateLegacyDebts(): Promise<void> {
 try {
  console.log('[Migration] Checking for legacy debt data...');
  
  const allDebts = await localDebtStore.listDebts({ includeDemo: false });
  
  // Find debts that need migration (have legacy fields or old norm version)
  const needsMigration = allDebts.filter(debt => 
   !debt._norm_v || 
   debt._norm_v < 2 ||
   debt.balance != null || 
   debt.interestRate != null || 
   debt.minPayment != null ||
   debt.limit != null
  );
  
  if (needsMigration.length === 0) {
   console.log('[Migration] No legacy debts found, migration complete');
   return;
  }
  
  console.log(`[Migration] Found ${needsMigration.length} legacy debts, normalizing...`);
  
  // Normalize each debt
  const normalizedDebts: Debt[] = needsMigration.map(debt => {
   const normalized = normalizeDebt(debt);
   
   // Preserve original timestamps if they exist
   return {
    ...normalized,
    created_at: debt.created_at || normalized.created_at,
    updated_at: debt.updated_at || normalized.updated_at,
   };
  });
  
  // Bulk upsert the normalized debts (this will overwrite with clean structure)
  for (const debt of normalizedDebts) {
   await localDebtStore.upsertDebt(debt);
  }
  
  console.log(`[Migration] Successfully normalized ${normalizedDebts.length} debts`);
  
  // Track detailed migration analytics (non-blocking)
  try {
   if (window.posthog) {
    // Count migration patterns
    const patterns = needsMigration.reduce((acc, debt) => {
     acc.total++;
     if (!debt._norm_v) acc.no_version++;
     if (debt._norm_v && debt._norm_v < 2) acc.old_version++;
     if (debt.balance != null) acc.has_legacy_balance++;
     if (debt.interestRate != null) acc.has_legacy_interest++;
     if (debt.minPayment != null) acc.has_legacy_payment++;
     if (debt.amount_pennies != null) acc.has_normalized_amount++;
     if (debt.apr != null) acc.has_normalized_apr++;
     if (debt.min_payment_pennies != null) acc.has_normalized_payment++;
     
     // Check for mixed format (the bug we fixed)
     const hasMixed = (debt.balance != null && debt.amount_pennies != null) ||
             (debt.interestRate != null && debt.apr != null) ||
             (debt.minPayment != null && debt.min_payment_pennies != null);
     if (hasMixed) acc.mixed_format++;
     
     return acc;
    }, {
     total: 0,
     no_version: 0,
     old_version: 0,
     has_legacy_balance: 0,
     has_legacy_interest: 0,
     has_legacy_payment: 0,
     has_normalized_amount: 0,
     has_normalized_apr: 0,
     has_normalized_payment: 0,
     mixed_format: 0
    });

    window.posthog.capture('legacy_debt_migration', {
     migrated_count: normalizedDebts.length,
     total_debts: allDebts.length,
     migration_version: 2,
     migration_patterns: patterns,
     mixed_format_rate: patterns.mixed_format / patterns.total,
     legacy_rate: (patterns.has_legacy_balance + patterns.has_legacy_interest + patterns.has_legacy_payment) / (patterns.total * 3),
     timestamp: new Date().toISOString()
    });

    // Track version adoption
    const versionDistribution = allDebts.reduce((acc, debt) => {
     const version = debt._norm_v || 0;
     acc[`v${version}`] = (acc[`v${version}`] || 0) + 1;
     return acc;
    }, {} as Record<string, number>);

    window.posthog.capture('debt_normalization_adoption', {
     total_debts: allDebts.length,
     version_distribution: versionDistribution,
     v2_adoption_rate: (versionDistribution.v2 || 0) / allDebts.length,
     pre_migration_v2_count: allDebts.filter(d => d._norm_v === 2).length - normalizedDebts.length,
     post_migration_v2_count: allDebts.filter(d => d._norm_v === 2).length,
     timestamp: new Date().toISOString()
    });
   }
  } catch (analyticsError) {
   // Never block migration for analytics
   console.debug('[Migration] Analytics tracking failed:', analyticsError);
  }
  
 } catch (error) {
  console.error('[Migration] Failed to migrate legacy debts:', error);
  // Don't throw - app should still work with unmigrated data
 }
}

/**
 * Emergency repair function for obviously corrupted data
 * Scans for values that are clearly over-inflated due to double conversion
 */
export async function repairCorruptedDebts(): Promise<void> {
 try {
  console.log('[Repair] Checking for corrupted debt values...');
  
  const allDebts = await localDebtStore.listDebts({ includeDemo: false });
  
  // Find debts with obviously inflated values (likely from double conversion)
  const corrupted = allDebts.filter(debt => 
   debt.amount_pennies > 10_000_000 || // > £100k is suspicious for most users
   debt.min_payment_pennies > 1_000_000 || // > £10k min payment is impossible
   debt.apr > 100_000 // > 1000% APR is clearly wrong
  );
  
  if (corrupted.length === 0) {
   console.log('[Repair] No corrupted debt values found');
   return;
  }
  
  console.log(`[Repair] Found ${corrupted.length} corrupted debts, repairing...`);
  
  const repaired = corrupted.map(debt => {
   const repairs: any = { ...debt };
   
   // If amount_pennies is suspiciously large and we have a legacy balance field that matches
   if (debt.amount_pennies > 10_000_000 && debt.balance && Math.abs(debt.amount_pennies - debt.balance * 100) < 1) {
    repairs.amount_pennies = Math.round(debt.balance); // Assume balance was already in pence
   }
   
   // Similar logic for other fields
   if (debt.min_payment_pennies > 1_000_000 && debt.minPayment && Math.abs(debt.min_payment_pennies - debt.minPayment * 100) < 1) {
    repairs.min_payment_pennies = Math.round(debt.minPayment);
   }
   
   if (debt.apr > 100_000 && debt.interestRate && Math.abs(debt.apr - debt.interestRate * 100) < 1) {
    repairs.apr = Math.round(debt.interestRate);
   }
   
   return repairs;
  });
  
  // Save repaired debts
  for (const debt of repaired) {
   await localDebtStore.upsertDebt(debt);
  }
  
  console.log(`[Repair] Successfully repaired ${repaired.length} corrupted debts`);
  
 } catch (error) {
  console.error('[Repair] Failed to repair corrupted debts:', error);
 }
}