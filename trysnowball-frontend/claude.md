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
│   ├── SpendAnalyser.js
│   └── auth.js
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
- Uses localStorage for client-side data persistence
- SpendAnalyser → WhatIfMachine integration via localStorage
- No server-side dependencies for core functionality

## Development Notes
- All financial data stays client-side
- Demo data available for testing
- Mobile-responsive design
- Debt snowball method implementation

## Current Session Todos
<!-- This section tracks ongoing work between sessions -->
- ✅ Remove SpendAnalyser component and related files
- ✅ Create Dave Ramsey's 7 Baby Steps page
- ✅ Update navigation to remove SpendAnalyser links
- ✅ Update WhatIfMachine to handle manual savings input instead of SpendAnalyser data
- ✅ Update CLAUDE.md with session context

## Session History
- Session started: 2025-07-17 - Context lost from previous session, implementing persistent todo tracking
- 2025-07-17 - Privacy & trust improvements: Removed SpendAnalyser, added Dave Ramsey Baby Steps page, integrated Money Helper budget tool recommendation