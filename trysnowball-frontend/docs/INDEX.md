# TrySnowball Documentation Index

| CP | Title                         | Status     | Description |
|----|-------------------------------|------------|-------------|
| 0  | System Overview               | 🛠️ Active  | High-level platform architecture |
| 1  | Clean Debt Model              | ✅ Live    | Canonical debt structure, validation |
| 2  | Forecast Engine v1            | ☠️ Deprecated | Single-APR forecast logic (legacy) |
| 3  | Multi-APR Bucket System       | ✅ Live    | Per-debt interest calculations |
| 3b | Bucket System Limitations     | ✅ Live    | What bucket model does NOT handle |
| 4  | Forecast Engine V2            | ✅ Complete | Composite simulation engine |
| 4b | Forecast Test Cases           | 🛠️ Expanding | Golden test fixtures + logic proofs |
| 5  | Goals Engine (Upcoming)       | 🕓 Planned | User-defined financial goals |

## Status Legend
- ✅ **Stable** - Well-established, rarely changes
- ✅ **Live** - Currently implemented and active  
- ✅ **Complete** - Implementation finished and tested
- ☠️ **Deprecated** - No longer used, kept for reference
- 🛠️ **Active** - Under active development
- 🕓 **Planned** - Future implementation

## Archive and Reference Folders

### `_archive_v1/`
Contains markdown files that were previously in the project root. These documents may contain useful historical information but should not be treated as current.

### `_v1_reference/`  
Contains selected legacy documentation from the original TrySnowball frontend repo. All files are marked with legacy warnings and should only be used for historical context.

**⚠️ Important**: Reference materials may contain deprecated field names like `amount_cents`, `min_payment_cents`, `apr_bps`, and outdated logic patterns.

## Quick Navigation

### For Development
- Start with **CP-0** for system overview
- **CP-1** for data structure requirements
- **CP-4** for current simulation implementation

### For Testing  
- **CP-4_TEST_CASES** for verification scenarios
- **CP-3_LIMITATIONS** for known system boundaries

### For Planning
- **CP-5** for upcoming features
- Reference folders for historical context

## Contribution Guidelines

1. All new features require corresponding CP documentation
2. Update this index when adding new CP documents
3. No .md files should be created in project root
4. Legacy references are read-only - do not modify