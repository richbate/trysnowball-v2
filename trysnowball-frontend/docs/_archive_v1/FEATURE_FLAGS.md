# Feature Flags

TrySnowball uses feature flags to control functionality during development and testing.

## Current Flags

### IMPORT_HISTORY_ENABLED
- **Default**: `false`
- **Location**: `src/config/flags.js`
- **Purpose**: Controls historical debt data import functionality
- **When enabled**: Shows import buttons, enables HistoryImporterModal, activates `/library/import-historical-data` route
- **When disabled**: Users must add debts manually via "Add Debt" button

## How to Toggle Flags

1. Edit `src/config/flags.js`
2. Change the flag value to `true` or `false`
3. Restart the development server or rebuild

```javascript
export const FLAGS = {
  IMPORT_HISTORY_ENABLED: true, // Enable import functionality
};
```

## Adding New Flags

1. Add the flag to `src/config/flags.js`
2. Import and use the flag in components: `import { FLAGS } from '../config/flags'`
3. Guard functionality: `{FLAGS.MY_NEW_FLAG && <Component />}`
4. Document the flag in this file

## Notes

- Feature flags should be temporary. Remove them when features are stable.
- Always provide a safe default (usually `false` for new features)
- Test both enabled and disabled states before deployment
- Use flags to gracefully degrade functionality, not break it