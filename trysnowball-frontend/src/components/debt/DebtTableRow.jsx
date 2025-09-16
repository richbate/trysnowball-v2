import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ChevronRight, Edit2, Trash2, Check, X, GripVertical, History } from 'lucide-react';
import { formatCurrency } from '../../utils/debtFormatting';

// Utility functions
const getUtilizationColor = (utilization) => {
  if (utilization > 90) return 'bg-red-500';
  if (utilization > 70) return 'bg-amber-500';
  return 'bg-emerald-500';
};

const DebtTableRow = ({ 
  debt, 
  index, 
  onEdit, 
  onDelete, 
  onBalanceUpdate, 
  onViewHistory,
  isExpanded, 
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  isDragging
}) => {
  const [editingBalance, setEditingBalance] = useState(false);
  const currentBalance = debt.balance || debt.amount || 0;
  const [balanceValue, setBalanceValue] = useState(currentBalance);

  // Update balanceValue when debt balance changes from parent
  useEffect(() => {
    const newBalance = debt.balance || debt.amount || 0;
    if (!editingBalance && newBalance !== balanceValue) {
      setBalanceValue(newBalance);
    }
  }, [debt.balance, debt.amount, editingBalance, balanceValue]);

  // Memoized calculations
  const utilization = useMemo(() => {
    return debt.limit ? (currentBalance / debt.limit) * 100 : 0;
  }, [currentBalance, debt.limit]);

  const utilizationColor = useMemo(() => {
    return getUtilizationColor(utilization);
  }, [utilization]);

  const formattedAmount = useMemo(() => {
    return formatCurrency(currentBalance);
  }, [currentBalance]);

  const formattedPayment = useMemo(() => {
    return formatCurrency(debt.minPayment || debt.regularPayment || 0);
  }, [debt.minPayment, debt.regularPayment]);

  const formattedOriginalAmount = useMemo(() => {
    return formatCurrency(debt.originalAmount || currentBalance);
  }, [debt.originalAmount, currentBalance]);

  const progressPercentage = useMemo(() => {
    const original = debt.originalAmount || currentBalance;
    if (original <= 0) return 0;
    return Math.max(0, (original - currentBalance) / original * 100);
  }, [debt.originalAmount, currentBalance]);

  const formattedLimit = useMemo(() => {
    return debt.limit ? formatCurrency(debt.limit) : null;
  }, [debt.limit]);

  // Stable handlers
  const handleBalanceSave = useCallback(() => {
    onBalanceUpdate(debt.id, balanceValue);
    setEditingBalance(false);
  }, [debt.id, balanceValue, onBalanceUpdate]);

  const handleBalanceCancel = useCallback(() => {
    setBalanceValue(currentBalance);
    setEditingBalance(false);
  }, [currentBalance]);

  const handleEditClick = useCallback(() => {
    onEdit(debt);
  }, [debt, onEdit]);

  const handleDeleteClick = useCallback(() => {
    onDelete(debt.id);
  }, [debt.id, onDelete]);

  const handleRowClick = useCallback(() => {
    onToggleExpand(debt.id);
  }, [debt.id, onToggleExpand]);

  const handleBalanceEditClick = useCallback(() => {
    setEditingBalance(true);
  }, []);

  const handleBalanceInputChange = useCallback((e) => {
    setBalanceValue(Number(e.target.value));
  }, []);

  const handleDragStartLocal = useCallback((e) => {
    onDragStart(e, debt, index);
  }, [debt, index, onDragStart]);

  const handleDragOverLocal = useCallback((e) => {
    onDragOver(e, index);
  }, [index, onDragOver]);

  const handleDropLocal = useCallback((e) => {
    onDrop(e, index);
  }, [index, onDrop]);

  return (
    <>
      <tr 
        className={`transition-all duration-200 cursor-pointer ${
          isDragging 
            ? 'opacity-50 bg-blue-50' 
            : isDragOver 
            ? 'bg-blue-100 border-t-2 border-blue-400' 
            : 'hover:bg-slate-50'
        }`}
        draggable={true}
        onDragStart={handleDragStartLocal}
        onDragEnd={onDragEnd}
        onDragOver={handleDragOverLocal}
        onDragLeave={onDragLeave}
        onDrop={handleDropLocal}
        onClick={handleRowClick}
      >
        <td className="px-8 py-5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center space-x-2">
            <GripVertical 
              className="h-5 w-5 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing" 
              title="Drag to reorder"
            />
            <div className="bg-blue-100 text-blue-800 text-sm font-bold rounded-full w-8 h-8 flex items-center justify-center">
              {debt.order || index + 1}
            </div>
          </div>
        </td>
        <td className="px-8 py-5 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-5 h-5 mr-4">
              <ChevronRight 
                className={`transform transition-transform text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}
              />
            </div>
            <div>
              <div className="text-base font-semibold text-slate-900">{debt.name}</div>
              {debt.isDemo && <div className="text-sm text-amber-600 font-medium">Demo Data</div>}
            </div>
          </div>
        </td>
        <td className="px-8 py-5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
          {editingBalance ? (
            <div className="flex items-center justify-end space-x-3">
              <input
                type="number"
                value={balanceValue}
                onChange={handleBalanceInputChange}
                className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-base text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                step="0.01"
                min="0"
              />
              <button
                onClick={handleBalanceSave}
                className="text-emerald-600 hover:text-emerald-700 p-1"
                title="Save"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={handleBalanceCancel}
                className="text-red-600 hover:text-red-700 p-1"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div 
              className="text-base font-semibold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline"
              onClick={handleBalanceEditClick}
              title="Click to edit balance"
            >
              {formattedAmount}
            </div>
          )}
        </td>
        <td className="px-8 py-5 whitespace-nowrap text-right text-base text-slate-700">
          {formattedPayment}
        </td>
        <td className="px-8 py-5 whitespace-nowrap text-right">
          <div className="flex items-center justify-end">
            <div className="w-20 bg-slate-200 rounded-full h-3 mr-3">
              <div 
                className="h-3 rounded-full bg-emerald-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-slate-600">{progressPercentage.toFixed(0)}%</span>
            {debt.previousBalance && debt.previousBalance > currentBalance && (
              <div className="ml-2 text-xs text-emerald-600 font-medium">
                ↓ £{formatCurrency(debt.previousBalance - currentBalance).replace('£', '')}
              </div>
            )}
          </div>
        </td>
        <td className="px-8 py-5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory?.(debt);
              }}
              className="text-gray-600 hover:text-gray-700 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              title="View payment history"
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={handleEditClick}
              className="text-blue-600 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit debt"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete debt"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="px-8 py-6 bg-slate-50">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-base">
              <div>
                <span className="font-semibold text-slate-700">Interest Rate:</span>
                <div className="text-slate-900 mt-1">{debt.interestRate || debt.interest || 0}%</div>
              </div>
              <div>
                <span className="font-semibold text-slate-700">Original Balance:</span>
                <div className="text-slate-900 mt-1">{formattedOriginalAmount}</div>
              </div>
              {debt.limit && (
                <div>
                  <span className="font-semibold text-slate-700">Credit Limit:</span>
                  <div className="text-slate-900 mt-1">{formattedLimit}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {utilization.toFixed(1)}% utilization
                  </div>
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-700">Type:</span>
                <div className="text-slate-900 mt-1">{debt.type || 'Credit Card'}</div>
              </div>
              {debt.previousBalance && (
                <div>
                  <span className="font-semibold text-slate-700">Previous Balance:</span>
                  <div className="text-slate-900 mt-1">{formatCurrency(debt.previousBalance)}</div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">
                    Paid down £{formatCurrency(debt.previousBalance - currentBalance).replace('£', '')}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default React.memo(DebtTableRow);