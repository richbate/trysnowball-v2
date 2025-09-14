# App Evaluation Framework

A comprehensive offline testing system that hammers every function/feature without manual UI testing.

## Framework Components

### 1. Contracts Registry (`tests/specs/contracts.ts`)
- Single source of truth for feature specifications 
- Zod schemas for data validation
- Invariant checks with structured test cases
- Automated contract runner (`tests/specs/runner.test.ts`)

### 2. Property-Based Testing (`tests/property/math.property.test.ts`)
- Fast-check fuzzing for edge cases
- Math function validation with 200+ test runs per property
- Handles corrupted data, boundary conditions, NaN/Infinity cases
- Ensures normalization functions are bulletproof

### 3. API Gateway Contracts (`tests/contracts/gateway.contract.test.ts`)
- Tests network failure modes without actual network calls
- Authentication circuit breaker behavior
- Demo mode isolation testing
- CRUD operation contracts with local-first approach

### 4. Runtime Invariants (`src/utils/invariants.ts`)
- Development-only assertions for data corruption detection
- Validates debt structures, totals, order contiguity
- Demo data leak prevention
- Business logic guardrails (min payments vs debt amounts)

### 5. Telemetry Evaluation (`tests/analytics/events.test.ts`)
- Analytics event validation with PostHog mocking
- PII leak detection in event properties
- Data format consistency (cents/bps preservation)
- Performance and timing instrumentation

### 6. Config/Flags Testing (`tests/config/flags.test.ts`)
- Environment configuration validation
- Feature flag combination testing
- API URL validation and security checks
- Build-time variable injection testing
- CSP compliance verification

### 7. Golden Master Snapshots (`tests/golden/snapshots.test.ts`)
- Critical output consistency checks
- Debt calculation result snapshots
- Timeline generation verification
- Performance baseline tracking
- Edge case scenario validation

## Usage

### Quick Evaluation (Critical Suites Only)
```bash
npm run evaluate:quick
```

### Full Evaluation
```bash
npm run evaluate
```

### CI Mode (Fail Fast)
```bash
npm run evaluate:ci
```

### Individual Test Suites
```bash
npm run eval:contracts    # Feature contracts
npm run eval:property     # Property-based fuzzing
npm run eval:gateway      # API gateway contracts  
npm run eval:analytics    # Telemetry evaluation
npm run eval:config       # Config and flags
npm run eval:golden       # Golden master snapshots
```

## Benefits

- **No Manual Testing**: Evaluates entire app programmatically
- **Regression Detection**: Golden snapshots catch unexpected changes
- **Edge Case Coverage**: Property-based testing finds bugs handwritten tests miss
- **Fast Feedback**: Quick mode runs critical tests in seconds
- **CI Integration**: Automated pass/fail with detailed reporting
- **Security Focus**: PII leak detection, CSP compliance, environment validation

## Reporting

Generates `evaluation-report.json` with:
- Pass/fail summary with success rates
- Critical vs non-critical failure classification  
- Specific error details and recommendations
- Deployment readiness assessment

## Integration

Add to CI pipeline:
```yaml
- name: Evaluate App
  run: npm run evaluate:ci
```

Framework catches issues like:
- Runtime crashes from undefined/NaN data
- Memory leaks from improper cleanup
- Analytics PII leaks  
- Configuration errors across environments
- API circuit breaker failures
- Mathematical calculation regressions

All evaluation happens offline - no servers, databases, or UI automation required.