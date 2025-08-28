import React, { useMemo, useState } from 'react';
import { buildPaymentMatrix, fmtMoney } from '../utils/buildPaymentMatrix';
import { filterDebtsForFocus } from '../lib/selectors';

export default function DebtPaymentMatrix({ timeline, debtOrder, monthLabel, defaultOpen = false, focusedDebtId = null }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAllColumns, setShowAllColumns] = useState(false);
  
  // Filter debt order for focus mode
  const filteredDebtOrder = useMemo(() => {
    if (!focusedDebtId || showAllColumns) return debtOrder;
    return debtOrder.filter(debtName => debtName === focusedDebtId);
  }, [debtOrder, focusedDebtId, showAllColumns]);
  
  const { debts, rows } = useMemo(
    () => buildPaymentMatrix(timeline, { debtOrder: filteredDebtOrder, monthLabel }),
    [timeline, filteredDebtOrder, monthLabel]
  );

  if (!rows.length) return null;

  return (
    <div className="mt-4 rounded-2xl border bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-lg font-semibold">Detailed Payment Schedule</h3>
          {focusedDebtId && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">
                Showing: {focusedDebtId}
              </span>
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                {showAllColumns ? 'Hide other debts' : 'Show all columns'}
              </button>
            </div>
          )}
        </div>
        <button
          className="text-sm rounded-xl border px-3 py-1 hover:bg-gray-50"
          onClick={() => setOpen(v => !v)}
        >
          {open ? 'Hide' : 'Show'}
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <Th>No.</Th>
                <Th>Month</Th>
                <Th className="text-right">Total Debt</Th>
                <Th className="text-right">Additional</Th>
                <Th className="text-right">Flex</Th>
                <Th className="text-right">Snowflakes</Th>
                {debts.map(d => <Th key={d} className="text-right">{d}</Th>)}
              </tr>
            </thead>
            <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/30">
              {rows.map(r => (
                <tr key={r.rowNo} className="border-t">
                  <Td>{r.rowNo}</Td>
                  <Td>{r.month}</Td>
                  <Td className="text-right">{fmtMoney(r.snowball)}</Td>
                  <Td className="text-right">{fmtMoney(r.additional)}</Td>
                  <Td className="text-right">{fmtMoney(r.flex)}</Td>
                  <Td className="text-right">
                    {r.snowflakes > 0 ? (
                      <span className="text-blue-600 font-medium">
                        {fmtMoney(r.snowflakes)} ❄️
                      </span>
                    ) : (
                      fmtMoney(r.snowflakes)
                    )}
                  </Td>
                  {debts.map(d => (
                    <Td key={d} className="text-right">{fmtMoney(r[d])}</Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = '' }) {
  return <th className={`px-3 py-2 font-semibold text-left whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = '' }) {
  return <td className={`px-3 py-2 whitespace-nowrap ${className}`}>{children}</td>;
}