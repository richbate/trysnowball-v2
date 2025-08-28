import React, { useState, useMemo } from 'react';
import { useDebts } from '../../hooks/useDebts';
import { formatCurrency } from '../../utils/debtFormatting';

// Import the sophisticated debt management components
import DebtSummaryCards from '../../components/debt/DebtSummaryCards';
import DebtTable from '../../components/debt/DebtTable';
import DebtFormModal from '../../components/debt/DebtFormModal';
import DebtHistoryViewer from '../../components/DebtHistoryViewer';
import SimpleToast from '../../components/SimpleToast';
import NoDebtsState from '../../components/NoDebtsState';

const DebtsTab = ({ loading }) => {
  // Use CP-1 normalized data path
  const { 
    debts,
    metrics = {},
    metricsLoading = false,
    addDebt, 
    updateDebt, 
    deleteDebt, 
    loadDemoData,
    clearAllData,
    reorderDebts,
    refresh
  } = useDebts();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [historyDebt, setHistoryDebt] = useState(null);
  const [toast, setToast] = useState(null);

  // Use normalized debts from CP-1 hook (always array)
  // debts is already normalized by toDebtArray() in useDebts

  // Use metrics from CP-1 hook + calculate credit utilization with safe destructuring
  const { totalDebt = 0, totalMinPayments = 0, creditUtilization } = useMemo(() => {
    // Safe array access with fallback
    const safeDebts = Array.isArray(debts) ? debts : [];
    const safeMetrics = metrics || {};
    
    // Calculate credit utilization from normalized debts
    const totalUsed = safeDebts.reduce((sum, debt) => sum + (debt?.balance || 0), 0);
    const totalLimit = safeDebts.reduce((sum, debt) => sum + (debt?.limit || 0), 0);
    const utilization = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    
    return {
      totalDebt: safeMetrics.totalDebt || 0,
      totalMinPayments: safeMetrics.totalMinPayments || 0,
      creditUtilization: utilization
    };
  }, [debts, metrics]);

  // Event handlers
  const handleAddDebt = () => {
    setEditingDebt(null);
    setShowAddModal(true);
  };

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setShowAddModal(true);
  };

  const handleDeleteDebt = async (debtId) => {
    if (window.confirm('Are you sure you want to delete this debt?')) {
      try {
        await deleteDebt(debtId);
        showToast('Debt deleted successfully', 'success');
      } catch (error) {
        showToast('Failed to delete debt', 'error');
      }
    }
  };

  const handleInlineBalanceUpdate = async (debtId, newBalance) => {
    try {
      // Use CP-1 updateDebt method
      await updateDebt(debtId, { balance: newBalance });
      showToast('Balance updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update balance', 'error');
    }
  };

  const handleViewHistory = (debt) => {
    setHistoryDebt(debt);
  };

  const handleReorderDebts = async (orderUpdates) => {
    try {
      await reorderDebts(orderUpdates);
      showToast('Debt order updated', 'success');
    } catch (error) {
      showToast('Failed to reorder debts', 'error');
    }
  };

  const handleSaveDebt = async (debtData) => {
    try {
      if (editingDebt) {
        await updateDebt(editingDebt.id, debtData);
        showToast('Debt updated successfully', 'success');
      } else {
        await addDebt(debtData);
        showToast('Debt added successfully', 'success');
      }
      setShowAddModal(false);
      setEditingDebt(null);
    } catch (error) {
      showToast(editingDebt ? 'Failed to update debt' : 'Failed to add debt', 'error');
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your debts...</p>
        </div>
      </div>
    );
  }

  // Empty state guard
  if (!loading && Array.isArray(debts) && debts.length === 0) {
    return (
      <NoDebtsState
        title="No debts yet"
        subtitle="Add your first debt or try the demo dataset to see the full experience."
        icon="💳"
        showSecondaryActions={true}
        onAdd={() => setShowAddModal(true)}
        onTryDemo={async () => {
          try {
            await loadDemoData('uk');
            refresh();
          } catch (e) {
            console.error('[Demo] load failed', e);
            alert('Failed to load demo data. Please try again.');
          }
        }}
      />
    );
  }

  // Debug logging with safe access
  console.log('🔍 DebtsTab Debug:', {
    debtsLength: Array.isArray(debts) ? debts.length : 0,
    debtsData: debts,
    metrics: metrics || {},
    totalDebt,
    totalMinPayments,
    creditUtilization,
    loading,
    metricsLoading
  });

  return (
    <div className="space-y-6">
      
      {/* Summary Cards - only show if debts exist */}
      {Array.isArray(debts) && debts.length > 0 && (
        <DebtSummaryCards 
          totalDebt={totalDebt} 
          totalMinPayments={totalMinPayments} 
          creditUtilization={creditUtilization}
          loading={metricsLoading}
        />
      )}

      {/* Debt Table with Card Wrapper */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <DebtTable 
          debts={debts}
          onEdit={handleEditDebt}
          onDelete={handleDeleteDebt}
          onBalanceUpdate={handleInlineBalanceUpdate}
          onViewHistory={handleViewHistory}
          loadDemoData={loadDemoData}
          onReorder={handleReorderDebts}
          onAddDebt={handleAddDebt}
        />
      </div>

      {/* Add/Edit Debt Modal */}
      {showAddModal && (
        <DebtFormModal
          isOpen={showAddModal}
          editingDebt={editingDebt}
          onSave={handleSaveDebt}
          onClose={() => {
            setShowAddModal(false);
            setEditingDebt(null);
          }}
          loading={false}
        />
      )}

      {/* Debt History Viewer */}
      {historyDebt && (
        <DebtHistoryViewer 
          debt={historyDebt}
          onClose={() => setHistoryDebt(null)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default DebtsTab;