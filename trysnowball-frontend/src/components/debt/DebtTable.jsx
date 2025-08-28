import React, { useState, useCallback, useMemo } from 'react';
import { Plus, GripVertical } from 'lucide-react';
import DebtTableRow from './DebtTableRow';
import AISyncAlert from './AISyncAlert';
import { useAIDebtManager } from '../../hooks/useAIDebtManager';

const EmptyDebtState = ({ loadDemoData, onAddDebt }) => (
  <div className="bg-white rounded-xl shadow-sm p-16 border border-slate-200 text-center mb-12">
    <button 
      onClick={onAddDebt}
      className="text-slate-400 hover:text-blue-600 transition-colors mb-6 cursor-pointer group"
      title="Click to add your first debt"
    >
      <Plus className="mx-auto h-16 w-16 group-hover:scale-110 transition-transform" />
    </button>
    <h3 className="text-xl font-semibold text-slate-900 mb-3">No debts added yet</h3>
    <p className="text-base text-slate-600 mb-4">Add your first debt to get started with your debt freedom plan</p>
    <button
      onClick={onAddDebt}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold mb-4"
    >
      Add Your First Debt
    </button>
    <div className="mt-4">
      <button
        onClick={loadDemoData}
        className="text-blue-600 hover:text-blue-700 text-base font-medium"
      >
        Or try with demo data
      </button>
    </div>
  </div>
);

const DebtTable = ({ debts, onEdit, onDelete, onBalanceUpdate, onViewHistory, loadDemoData, onReorder, onAddDebt }) => {
  const [expandedDebt, setExpandedDebt] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // AI sync alert functionality
  const { lastAIUpdate, aiUpdateSummary, getAIUpdateTimeString } = useAIDebtManager({ requireConfirmation: false });

  const handleToggleExpand = useCallback(
    (debtId) => {
      setExpandedDebt((prev) => (prev === debtId ? null : debtId));
    },
    []
  );

  const handleDragStart = useCallback((e, debt, index) => {
    setDraggedItem({ debt, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.index !== targetIndex && onReorder) {
      const newDebts = [...debts];
      const [draggedDebt] = newDebts.splice(draggedItem.index, 1);
      newDebts.splice(targetIndex, 0, draggedDebt);
      
      // Update order values for all debts
      const updatedDebts = newDebts.map((debt, index) => ({
        ...debt,
        order: index + 1
      }));
      
      onReorder(updatedDebts);
    }
    
    setDraggedItem(null);
    setDragOverIndex(null);
  }, [draggedItem, debts, onReorder]);

  const rows = useMemo(
    () =>
      debts.map((debt, index) => (
        <DebtTableRow
          key={debt.id}
          debt={debt}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onBalanceUpdate={onBalanceUpdate}
          onViewHistory={onViewHistory}
          isExpanded={expandedDebt === debt.id}
          onToggleExpand={handleToggleExpand}
          // Drag functionality disabled on debts list
          isDragOver={false}
          isDragging={false}
        />
      )),
    [debts, expandedDebt, onEdit, onDelete, onBalanceUpdate, onViewHistory, handleToggleExpand]
  );

  if (debts.length === 0) {
    return (
      <>
        {/* AI Sync Alert for empty state too */}
        <AISyncAlert 
          lastAIUpdate={lastAIUpdate}
          aiUpdateSummary={aiUpdateSummary}
          getAIUpdateTimeString={getAIUpdateTimeString}
        />
        <EmptyDebtState loadDemoData={loadDemoData} onAddDebt={onAddDebt} />
      </>
    );
  }

  return (
    <>
      {/* AI Sync Alert */}
      <AISyncAlert 
        lastAIUpdate={lastAIUpdate}
        aiUpdateSummary={aiUpdateSummary}
        getAIUpdateTimeString={getAIUpdateTimeString}
      />
      
      <div className="bg-white rounded-xl shadow-sm mb-12 border border-slate-200">
        <div className="px-8 py-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Your Debts</h2>
          <p className="text-base text-slate-600 mt-2">Click on any row to view details • Drag rows to reorder</p>
        </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-8 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Order
              </th>
              <th className="px-8 py-4 text-left text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Debt Name
              </th>
              <th className="px-8 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Current Balance
              </th>
              <th className="px-8 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Min Payment
              </th>
              <th className="px-8 py-4 text-right text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-8 py-4 text-center text-sm font-semibold text-slate-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">{rows}</tbody>
        </table>
      </div>
    </div>
    </>
  );
};

export default React.memo(DebtTable);