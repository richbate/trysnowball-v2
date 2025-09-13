# CP-5 Limitations & Assumptions
**Status**: DOCUMENTED | **Review Date**: January 2025

## Forecast Dependency

### Accuracy Limitations
| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **APR Expiry Unsupported** | 0% promotional rates assumed permanent | Document assumption, manual updates |
| **Fixed Minimum Payments** | Payment changes not simulated | Advise users to update when changed |
| **Monthly Granularity** | Daily precision not available | Set realistic expectations |
| **Perfect Payment Timing** | Assumes on-time payments | Acknowledge real-world variations |

### Goal Achievement Dependencies
- Goals depend on forecast engine accuracy
- Interest saved calculations rely on minimum payment assumptions
- Debt clearance dates subject to forecast limitations
- Bucket targeting requires composite forecast accuracy

## Entitlement Model Limitations (v1.0)

### Configuration Constraints
- **Static Config**: Stored in code, not database
- **No Admin UI**: Runtime changes require deployments
- **Tier Detection**: Manual user tier assignment only
- **Override Granularity**: Per-tier only, no user-specific exceptions

### Business Rule Flexibility
```javascript
// Current: Can change limits via config
{ "feature": "goals.max_active", "value": 1, "tier": "free" }
// Future: Need admin UI for dynamic changes
```

## User Experience Limitations

### Goal Types & Targeting
- **Free Users**: DEBT_CLEAR goals only (may feel restrictive)
- **Bucket Targeting**: Pro-only feature (creates feature gap)
- **Achievement Detection**: Dependent on user updating debt balances
- **Real-time Progress**: Only updated on forecast runs

### Failure Scenarios
- **Missed Target Dates**: May frustrate users if unrealistic
- **Stale Progress**: Goals don't auto-update without user action
- **Entitlement Blocks**: Abrupt upgrade prompts may harm UX

## Technical Debt & Future Work

### v1.0 Known Issues
1. **No Goal Editing**: Users can't modify targets (only cancel/recreate)
2. **No Goal History**: Completed goals not archived for review
3. **Basic Analytics**: Limited to creation/achievement events
4. **Manual Progress Updates**: No automatic debt sync integration

### Architecture Constraints
- Goals engine separate from forecast engine (coupling risk)
- Entitlements checked at creation only (not runtime)
- Analytics events not deduplicated (potential spam)
- No goal-to-goal dependencies (can't chain goals)

## Real-World Variations

### User Behavior Assumptions
- **Model**: Users set realistic, achievable goals
- **Reality**: May set overly ambitious targets leading to failure
- **Model**: Goals motivate consistent behavior
- **Reality**: Motivation may wane without regular reinforcement

### Financial Reality Gaps
- **Model**: Predictable debt payments and balances
- **Reality**: Emergency expenses, income changes, missed payments
- **Model**: Single debt focus per goal
- **Reality**: Users may prefer portfolio-level goals

## Disclosure Requirements

⚠️ **User Messaging Required**:
- Goals are estimates based on current debt data and payment patterns
- Achievement depends on maintaining consistent payments
- Forecast limitations apply to all goal calculations
- Free tier restrictions clearly communicated upfront

## Success Metrics & Monitoring

### What We Can Measure
- Goal creation rates by type and tier
- Achievement vs failure rates
- Entitlement conversion (blocked → upgrade)
- Time-to-achievement distributions

### What We Cannot Measure (v1.0)
- Goal editing frequency (not supported)
- User satisfaction with achievement timing
- Impact on actual debt payment behavior
- Cross-goal interaction effects