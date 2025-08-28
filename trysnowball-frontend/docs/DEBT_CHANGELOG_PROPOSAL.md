# Debt Change Log Implementation Proposal

⚠️ **Do NOT access `.data` on any manager.** Always use the async facade (e.g., `debtsManager.getData()` / `getMetrics()`). Direct `.data` access will crash in production and is blocked by ESLint, dev proxy guard, and CI.

## Enhanced Data Model

```javascript
// Enhanced debt object with history tracking
{
  id: "paypal",
  name: "Paypal",
  balance: 1100,                    // Current balance
  minPayment: 255,
  originalAmount: 1400,             // Initial amount
  createdAt: "2025-01-29T10:30:00.000Z",
  updatedAt: "2025-01-29T15:45:00.000Z",  // Most recent change
  
  // NEW: Complete change history
  debt_history: [
    {
      id: "hist_001",
      timestamp: "2025-01-15T10:00:00.000Z",
      type: "created",
      previousBalance: null,
      newBalance: 1400,
      change: null,
      source: "manual_entry",
      note: "Initial debt entry",
      metadata: {
        userAgent: "...",
        ip: "...",  // Optional for security
        sessionId: "..."
      }
    },
    {
      id: "hist_002", 
      timestamp: "2025-01-29T15:45:00.000Z",
      type: "balance_update",
      previousBalance: 1400,
      newBalance: 1100,
      change: -300,
      source: "balance_update_modal",
      note: "Monthly balance update",
      metadata: {
        updateBatch: "jan_2025_update",
        totalDebtsUpdated: 8
      }
    },
    {
      id: "hist_003",
      timestamp: "2025-02-01T09:30:00.000Z", 
      type: "payment_recorded",
      previousBalance: 1100,
      newBalance: 845,
      change: -255,
      source: "payment_tracker",
      note: "Minimum payment recorded",
      metadata: {
        paymentMethod: "bank_transfer",
        confirmationNumber: "TXN123456"
      }
    }
  ],
  
  // Quick access computed fields
  totalReduction: 555,              // originalAmount - balance
  lastChangeAmount: -255,           // Most recent change
  lastChangeDate: "2025-02-01T09:30:00.000Z",
  changeCount: 3                    // Number of historical entries
}
```

## Implementation Plan

### 1. Enhanced debtsManager.js

```javascript
// In debtsManager.js
saveDebt(debt, options = {}) {
  const { debts } = await this.getData(); // ✅ Use facade method
  const existingIndex = debts.findIndex(d => d.id === debt.id);
  const timestamp = new Date().toISOString();
  
  if (existingIndex >= 0) {
    const existingDebt = debts[existingIndex];
    const previousBalance = existingDebt.balance;
    const newBalance = debt.balance;
    const change = newBalance - previousBalance;
    
    // Only add history entry if balance actually changed
    if (change !== 0) {
      const historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp,
        type: options.type || 'balance_update',
        previousBalance,
        newBalance,
        change,
        source: options.source || 'manual',
        note: options.note || 'Balance updated',
        metadata: {
          updateBatch: options.batchId,
          userAgent: navigator.userAgent,
          ...options.metadata
        }
      };
      
      // Initialize history array if it doesn't exist
      if (!existingDebt.debt_history) {
        existingDebt.debt_history = [];
      }
      
      // Add new entry
      existingDebt.debt_history.push(historyEntry);
      
      // Optional: Limit history size (keep last 50 entries)
      if (existingDebt.debt_history.length > 50) {
        existingDebt.debt_history = existingDebt.debt_history.slice(-50);
      }
    }
    
    // Update the debt
    debts[existingIndex] = { 
      ...existingDebt,
      ...debt,
      updatedAt: timestamp,
      totalReduction: existingDebt.originalAmount - newBalance,
      lastChangeAmount: change,
      lastChangeDate: timestamp,
      changeCount: existingDebt.debt_history?.length || 0
    };
  } else {
    // New debt - create with initial history entry
    debts.push({
      ...debt,
      id: debt.id || Date.now().toString(),
      originalAmount: debt.balance || debt.amount,
      createdAt: timestamp,
      updatedAt: timestamp,
      debt_history: [{
        id: `hist_${Date.now()}_init`,
        timestamp,
        type: 'created',
        previousBalance: null,
        newBalance: debt.balance || debt.amount,
        change: null,
        source: options.source || 'manual_entry',
        note: options.note || 'Initial debt entry',
        metadata: options.metadata || {}
      }],
      totalReduction: 0,
      lastChangeAmount: null,
      lastChangeDate: timestamp,
      changeCount: 1
    });
  }
  
  await this.saveDebts(debts); // ✅ Use facade method
  this.saveData();
}

// New helper methods
getDebtHistory(debtId) {
  const { debts } = await this.getData();
  const debt = debts.find(d => d.id === debtId); // ✅ Use facade method
  return debt?.debt_history || [];
}

getDebtChangesAfter(debtId, date) {
  const history = this.getDebtHistory(debtId);
  return history.filter(entry => new Date(entry.timestamp) > new Date(date));
}

getDebtChangesSummary(debtId) {
  const history = this.getDebtHistory(debtId);
  if (history.length === 0) return null;
  
  const first = history[0];
  const last = history[history.length - 1];
  
  return {
    totalChanges: history.length,
    firstEntry: first.timestamp,
    lastEntry: last.timestamp,
    totalReduction: first.newBalance - last.newBalance,
    averageMonthlyReduction: calculateAverageReduction(history),
    biggestSingleReduction: Math.min(...history.map(h => h.change || 0)),
    biggestSingleIncrease: Math.max(...history.map(h => h.change || 0).filter(c => c > 0))
  };
}
```

### 2. Enhanced UpdateBalances Component

```javascript
// In UpdateBalances.jsx handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  const batchId = `batch_${Date.now()}`;
  const updatedDebts = [];
  
  for (const [key, data] of Object.entries(balances)) {
    const newBalance = parseInt(data.current) || data.january;
    const previousBalance = data.january; // Or get from existing debt
    
    updatedDebts.push({
      id: key,
      name: data.name,
      balance: newBalance,
      // ... other fields
    });
    
    // Save with history tracking
    await debtsManager.saveDebt({
      id: key,
      name: data.name,
      balance: newBalance,
      minPayment: data.min
    }, {
      type: 'balance_update',
      source: 'balance_update_modal',
      note: `Monthly balance update for ${data.name}`,
      batchId,
      metadata: {
        previousBalance,
        updateType: 'bulk_update',
        totalDebtsInBatch: Object.keys(balances).length
      }
    });
  }
  
  // ... rest of submit logic
};
```

### 3. New History Viewer Component

```javascript
// New component: DebtHistoryViewer.jsx
const DebtHistoryViewer = ({ debtId, onClose }) => {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    const debtHistory = debtsManager.getDebtHistory(debtId);
    setHistory(debtHistory);
  }, [debtId]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Debt Change History</h2>
        
        <div className="space-y-3">
          {history.map((entry) => (
            <div key={entry.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{entry.type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className={`font-bold ${entry.change < 0 ? 'text-green-600' : entry.change > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {entry.change ? `${entry.change > 0 ? '+' : ''}£${entry.change}` : 'N/A'}
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                <span>Balance: £{entry.previousBalance} → £{entry.newBalance}</span>
                {entry.note && <span className="ml-4 text-gray-600">({entry.note})</span>}
              </div>
              
              <div className="mt-1 text-xs text-gray-500">
                Source: {entry.source}
                {entry.metadata.updateBatch && ` • Batch: ${entry.metadata.updateBatch}`}
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded">
          Close
        </button>
      </div>
    </div>
  );
};
```

## Benefits

✅ **Complete Audit Trail** - See every single balance change  
✅ **Debug Capabilities** - Trace calculation issues step-by-step  
✅ **User Insights** - Understand payment patterns and progress  
✅ **Data Integrity** - Verify calculations against historical data  
✅ **Batch Tracking** - Group related updates together  
✅ **Performance Monitoring** - Track how often users update balances  
✅ **Rollback Capability** - Potential to undo changes if needed  

## Storage Considerations

- **Size**: ~200-500 bytes per history entry
- **Limit**: Keep last 50 entries per debt (configurable)  
- **Cleanup**: Optional background cleanup of old entries
- **Export**: Can export full history as CSV for analysis

## Implementation Effort

- **Low Risk**: Additive change, doesn't break existing functionality
- **Backward Compatible**: Existing debts work without history
- **Incremental**: Can be implemented debt-by-debt
- **Optional UI**: History viewer can be added later

This would give you incredible insight into user behavior and debt progress patterns!