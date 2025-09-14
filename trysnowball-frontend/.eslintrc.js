module.exports = {
  extends: ['react-app', 'react-app/jest'],
  overrides: [
    {
      files: ["src/**/*.{ts,tsx,js,jsx}"],
      rules: {
        "no-restricted-imports": ["error", {
          paths: [
            { 
              name: "src/hooks/useDebts.legacy", 
              message: "Removed. Use useUserDebts." 
            },
            { 
              name: "./useDebts.legacy", 
              message: "Removed. Use useUserDebts." 
            },
            { 
              name: "../hooks/useDebts.legacy", 
              message: "Removed. Use useUserDebts." 
            },
            { 
              name: "src/hooks/useDebts", 
              message: "Deprecated alias. Import from src/hooks/useUserDebts instead." 
            },
            { 
              name: "./useDebts", 
              message: "Deprecated alias. Import from ./useUserDebts instead." 
            },
            { 
              name: "../hooks/useDebts", 
              message: "Deprecated alias. Import from ../hooks/useUserDebts instead." 
            }
          ]
        }],
        "no-restricted-syntax": [
          "error",
          {
            selector: "CallExpression[callee.name='upsertDebt'] ObjectExpression > SpreadElement",
            message: "Do not spread into upsertDebt; use upsertDebtSafe with explicit keys."
          },
          {
            selector: "CallExpression[callee.name='upsertDebtSafe'] ObjectExpression > SpreadElement", 
            message: "Do not spread into upsertDebtSafe; pass explicit normalized fields."
          },
          {
            selector: "CallExpression[callee.property.name='where'] Literal[value='isDemo']",
            message: "isDemo is not indexed in Dexie schema; use toArray() + filter() instead."
          },
          // Removed obsolete rules - we now use clean UK format (amount, apr, min_payment)
          // No more cents/bps conversions needed!
        ]
      }
    },
    // Temporary quarantine for legacy field violations - TO BE REMOVED
    {
      files: [
        "src/components/DebtHistoryViewer.*",
        "src/components/DebtTimeline.*", 
        "src/components/DebtPaymentMatrix.*",
        "src/components/charts/SnowballChart.*",
        "src/components/debt/DebtFormModal.*",
        "src/lib/debtsManager.*",
        "src/compat/**/*",
        "src/utils/debtTimelineCalculator.*",
        "src/utils/generateMilestonesFromHistory.*",
        "src/utils/generateUserCommitments.*",
        "src/utils/gptContextBuilders.*",
        "src/utils/csvMappers.*",
        "src/utils/calculateTrend.*",
        "src/utils/debtEngineAdapter.*",
        "src/utils/balanceTransferScenarios.*"
      ],
      rules: {
        "no-restricted-syntax": "off"
      }
    }
  ]
};