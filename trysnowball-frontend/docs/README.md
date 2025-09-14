# TrySnowball Documentation

This folder contains the canonical documentation for the TrySnowball platform, organized using the CP (Canonical Process) documentation structure.

## Documentation Structure

### CP-Series Documentation (Source of Truth)
- `CP-0_SYSTEM_OVERVIEW.md` - High-level platform architecture
- `CP-1_CLEAN_DEBT_MODEL.md` - Canonical debt structure and validation
- `CP-2_FORECAST_ENGINE_V1.md` - Single-APR forecast logic (legacy)
- `CP-3_BUCKET_SYSTEM.md` - Multi-APR schema and priority rules
- `CP-3_LIMITATIONS.md` - What the bucket model does NOT handle
- `CP-4_FORECAST_ENGINE_V2.md` - Composite simulation engine
- `CP-4_TEST_CASES.md` - Golden test fixtures and logic proofs
- `CP-5_GOALS_ENGINE.md` - Placeholder for next system

### Reference Material

The `/_archive_v1` folder contains markdown files that were previously in the project root.
The `/_v1_reference` folder contains legacy markdown files copied from the original TrySnowball frontend repo.

**Important**: Reference folders are not source-of-truth documents. They may contain outdated logic, assumptions, or terminology. Use them only for historical insight when writing or validating new CP-series documentation.

## Documentation Policy

### For Contributors
- No .md files should be created in the project root
- No PR should be merged without a matching doc (or explicit update to an existing CP doc)
- All CP docs must list:
  - Affected code paths
  - Simulation rules  
  - User assumptions
  - Known limitations

### For Logic-Level Features
Every new logic-level feature must have corresponding documentation in the CP-series. No nested folders like `/features/` or `/docs/features/forecast/` - keep the structure flat, clean, and canonical.

### Doc Status Indicators
- ✅ Stable - Well-established, rarely changes
- ✅ Live - Currently implemented and active
- ☠️ Deprecated - No longer used, kept for reference
- 🛠️ Active - Under active development
- 🕓 Planned - Future implementation

## Legacy Field Reference
When reviewing `_v1_reference` files, note that they may contain legacy field names that have been replaced:
- `amount_cents` → `amount`
- `min_payment_cents` → `min_payment` 
- `apr_bps` → `apr`