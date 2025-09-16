# Claude Settings & Project Configuration

## Build & Test Commands
- **Build**: `npm run build`
- **Start**: `npm start`
- **Test**: `npm test`

## Project Type
- React application using Create React App
- TailwindCSS for styling
- Recharts for data visualization
- Supabase for potential backend (configured but not actively used)

## Key Dependencies
- React 18.2.0
- React Router DOM 7.6.3
- Recharts 3.0.2
- Supabase JS 2.50.3
- TailwindCSS 3.3.2

## Project Structure
```
src/
├── components/
│   ├── EmailPrompt.js
│   └── ThemeToggle.js
├── pages/
│   ├── Home.jsx
│   ├── Library.jsx
│   ├── MyDebtsPage.js
│   ├── ThankYou.js
│   └── WhatIfMachine.js
├── lib/
│   └── supabase.js
├── App.js
└── index.js
```

## Data Flow
- **Demo Mode**: Uses localStorage for client-side demo data
- **Authenticated Users**: Cloud storage with Cloudflare D1 + multi-device sync
- Smart routing between demo and cloud storage based on auth state

## Development Notes
- Demo data stays client-side, real user data syncs to cloud
- Proper user isolation with server-side storage
- Mobile-responsive design
- Debt snowball method implementation

## Current Session Todos
<!-- This section tracks ongoing work between sessions -->
- ✅ Remove SpendAnalyser component and related files
- ✅ Create Dave Ramsey's 7 Baby Steps page
- ✅ Update navigation to remove SpendAnalyser links
- ✅ Update WhatIfMachine to handle manual savings input instead of SpendAnalyser data
- ✅ Update CLAUDE.md with session context
- ✅ Fixed critical runtime crashes ("reduce is not a function", "Cannot read properties of undefined")
- ✅ Implemented CP-1 Data Layer Consolidation with IndexedDB migration
- ✅ Added defensive programming with toDebtArray normalizer
- ✅ Created no-op deprecation shims to prevent legacy storage crashes
- ✅ Improved empty state UX after clearing demo data
- ✅ Added comprehensive unit tests for crash prevention (14 tests passing)

## Critical Fixes Applied
**Runtime Stability**: Fixed app-breaking crashes when clearing demo data or handling malformed responses:
- **toDebtArray()** normalizer ensures all debt operations receive arrays
- **Deprecation shims** prevent legacy localStorage writes from crashing React
- **Safety guards** in useDebts hook with try-catch and fallback values
- **Polished empty states** with intentional UX design and focus management

**Data Layer**: Completed CP-1 consolidation to IndexedDB with bulletproof migration.

## Session History
- Session started: 2025-07-17 - Context lost from previous session, implementing persistent todo tracking
- 2025-07-17 - Privacy & trust improvements: Removed SpendAnalyser, added Dave Ramsey Baby Steps page, integrated Money Helper budget tool recommendation
- 2025-08-24 - Critical stability fixes: Eliminated runtime crashes, improved data layer reliability, added comprehensive test coverage
# Force rebuild Thu Jul 17 13:14:51 BST 2025
