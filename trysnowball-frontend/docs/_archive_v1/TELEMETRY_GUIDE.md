# Debt Normalization Telemetry Guide

## Overview

The debt normalization system now includes comprehensive telemetry to track adoption rates, migration patterns, and data quality issues. This helps monitor the health of the migration from legacy mixed-format data to clean normalized data.

## Events Tracked

### 1. `debt_normalization_pattern` 
**Trigger**: When normalizing debts with significant patterns (version upgrades, mixed format)
**Frequency**: Once per unique pattern per session (deduplicated)

```javascript
{
  input_version: 0,           // Version of input debt data
  output_version: 2,          // Current normalization version
  version_upgraded: true,     // Whether version was incremented
  had_normalized_fields: true,// Whether input had amount_cents, apr_bps, etc.
  had_legacy_fields: true,    // Whether input had balance, interestRate, etc.
  mixed_format: true,         // Whether both formats were present (the bug!)
  heuristics_used: {
    balance_heuristic: false,    // Whether balance needed unit detection
    interest_heuristic: false,   // Whether interest rate needed unit detection  
    payment_heuristic: false     // Whether min payment needed unit detection
  },
  conversions_applied: {
    balance_converted: false,      // Whether balance was converted from GBP
    balance_kept_as_cents: true,   // Whether balance was kept as cents
    interest_converted: false,     // Whether interest was converted from %
    interest_kept_as_bps: true     // Whether interest was kept as bps
  },
  session_count: 5,           // Number of normalizations in this session
  pattern_key: "mixedupgrade", // Unique pattern identifier
  first_occurrence_in_session: true,
  timestamp: "2025-01-07T..."
}
```

### 2. `debt_normalization_session`
**Trigger**: Every 10 normalizations or after 30 seconds
**Purpose**: Batch session-level statistics

```javascript
{
  total_normalizations: 15,    // Total normalizations this session
  version_upgrades: 8,         // How many resulted in version upgrades
  mixed_format_fixes: 3,       // How many fixed mixed format issues
  heuristic_usage: 4,          // How many used heuristic unit detection
  upgrade_rate: 0.53,          // version_upgrades / total_normalizations
  mixed_format_rate: 0.20,     // mixed_format_fixes / total_normalizations  
  session_duration_ms: 45000,  // Time since last batch
  timestamp: "2025-01-07T..."
}
```

### 3. `legacy_debt_migration` 
**Trigger**: During background migration of legacy debts
**Purpose**: Track migration patterns and success rates

```javascript
{
  migrated_count: 5,           // Number of debts migrated
  total_debts: 12,             // Total debts in database
  migration_version: 2,         // Target migration version
  migration_patterns: {
    total: 5,                   // Total debts needing migration
    no_version: 3,              // Debts with no version field
    old_version: 2,             // Debts with version < 2
    has_legacy_balance: 4,      // Debts with legacy balance field
    has_legacy_interest: 4,     // Debts with legacy interestRate field
    has_legacy_payment: 4,      // Debts with legacy minPayment field
    has_normalized_amount: 2,   // Debts with amount_cents field
    has_normalized_apr: 2,      // Debts with apr_bps field
    has_normalized_payment: 2,  // Debts with min_payment_cents field
    mixed_format: 2             // Debts with BOTH formats (the bug!)
  },
  mixed_format_rate: 0.40,     // Percentage with mixed format
  legacy_rate: 0.80,           // Percentage with legacy fields
  timestamp: "2025-01-07T..."
}
```

### 4. `debt_normalization_adoption`
**Trigger**: After migration completes
**Purpose**: Track version adoption rates across user base

```javascript
{
  total_debts: 12,             // Total debts after migration
  version_distribution: {
    "v0": 2,                   // Debts still at version 0 (unmigrated)
    "v1": 1,                   // Debts at version 1 (old format)
    "v2": 9                    // Debts at version 2 (current format)
  },
  v2_adoption_rate: 0.75,      // Percentage of debts at current version
  pre_migration_v2_count: 4,   // v2 debts before this migration
  post_migration_v2_count: 9,  // v2 debts after this migration
  timestamp: "2025-01-07T..."
}
```

## Dashboard Queries

### Version 2 Adoption Rate
```sql
SELECT 
  AVG(v2_adoption_rate) as avg_adoption_rate,
  COUNT(*) as users_migrated
FROM debt_normalization_adoption 
WHERE timestamp > NOW() - INTERVAL '7 days'
```

### Mixed Format Bug Impact
```sql  
SELECT
  SUM(migration_patterns.mixed_format) as total_mixed_format_debts,
  SUM(migrated_count) as total_migrated_debts,
  AVG(mixed_format_rate) as avg_mixed_format_rate
FROM legacy_debt_migration
WHERE timestamp > NOW() - INTERVAL '7 days'
```

### Heuristic Usage Patterns
```sql
SELECT
  AVG(heuristic_usage_rate) as avg_heuristic_usage,
  COUNT(*) as sessions_with_heuristics
FROM debt_normalization_session
WHERE heuristic_usage > 0
AND timestamp > NOW() - INTERVAL '7 days'  
```

## Debugging

### Browser Console Commands
```javascript
// View live normalization stats
__NORMALIZATION_STATS__()

// Results:
{
  normalizations: 15,
  version_upgrades: 8, 
  mixed_format_fixes: 3,
  heuristic_usage: 4,
  session_duration_ms: 45231,
  patterns_seen: ["mixedupgrade", "upgrade"],
  rates: {
    upgrade_rate: 0.533,
    mixed_format_rate: 0.200,
    heuristic_usage_rate: 0.267
  }
}
```

### Key Metrics to Monitor

1. **Mixed Format Rate**: Should decrease over time as migration completes
2. **Version 2 Adoption Rate**: Should approach 100% within days of deployment
3. **Heuristic Usage Rate**: Indicates how often unit detection is needed
4. **Migration Success Rate**: Percentage of users successfully migrated

## Alerts

Set up alerts for:
- **High mixed format rate** (>20%) indicating migration issues
- **Low v2 adoption rate** (<80%) after 1 week indicating blocked migrations
- **High heuristic usage** (>50%) indicating data quality issues
- **Migration failures** (error logs) indicating systematic problems

## Privacy & Performance

- **Non-blocking**: All telemetry is async and never blocks user operations
- **Non-sensitive**: No actual debt amounts, names, or PII are tracked  
- **Batched**: Session events are batched to reduce analytics load
- **Deduplicated**: Pattern events are sent once per session to avoid spam
- **Error-safe**: Telemetry failures are swallowed and logged in dev only

## Future Enhancements

When bumping to version 3:
1. Update `output_version: 3` in normalizer
2. Add new migration patterns to track
3. Update dashboard queries for v3 adoption
4. Monitor migration from v2→v3 patterns