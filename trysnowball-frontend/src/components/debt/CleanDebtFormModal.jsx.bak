import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import { Check, X } from 'lucide-react';
import { formatPounds, formatPercentage } from '../../types/ukDebt';

/**
 * Clean UK debt form - no American cents/bps nonsense
 * Uses real British pounds and percentages
 */
const CleanDebtFormModal = ({ isOpen, onClose, onSave, editingDebt, loading }) => {
 const [formData, setFormData] = useState({
  name: '',
  amount: 0,       // current amount (pounds)
  original_amount: undefined, // starting amount (pounds, optional)
  apr: 20.0,       // percentage
  min_payment: 0,    // pounds
  limit: undefined,   // pounds (optional)
  debt_type: 'credit_card',
  order_index: 0
 });

 // Update form when editing debt changes
 useEffect(() => {
  if (editingDebt) {
   setFormData({
    name: editingDebt.name || '',
    amount: editingDebt.amount || 0,
    original_amount: editingDebt.original_amount,
    apr: editingDebt.apr || 20.0,
    min_payment: editingDebt.min_payment || 0,
    limit: editingDebt.limit,
    debt_type: editingDebt.debt_type || 'credit_card',
    order_index: editingDebt.order_index || 0
   });
  } else {
   // Reset for new debt
   setFormData({
    name: '',
    amount: 0,
    original_amount: undefined,
    apr: 20.0,
    min_payment: 0,
    limit: undefined,
    debt_type: 'credit_card',
    order_index: 0
   });
  }
 }, [editingDebt]);

 const handleClose = useCallback(() => {
  setFormData({
   name: '',
   amount: 0,
   original_amount: undefined,
   apr: 20.0,
   min_payment: 0,
   limit: undefined,
   debt_type: 'credit_card',
   order_index: 0
  });
  onClose();
 }, [onClose]);

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name.trim()) {
   return; // Basic validation
  }

  // Clean UK debt payload - no transformations needed!
  const debtPayload = {
   id: editingDebt?.id, // Keep existing ID for updates
   name: formData.name.trim(),
   amount: parseFloat(formData.amount) || 0,
   original_amount: formData.original_amount ? parseFloat(formData.original_amount) : undefined,
   apr: parseFloat(formData.apr) || 0,
   min_payment: parseFloat(formData.min_payment) || 0,
   limit: formData.limit ? parseFloat(formData.limit) : undefined,
   debt_type: formData.debt_type,
   order_index: parseInt(formData.order_index) || 0,
   created_at: editingDebt?.created_at || new Date().toISOString(),
   updated_at: new Date().toISOString()
  };

  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 [UK_FORM] Clean debt payload:', debtPayload);

  try {
   await onSave(debtPayload);
   handleClose();
  } catch (error) {
   console.error('❌ [UK_FORM] Error saving debt:', error);
  }
 };

 // ESC key handler
 useEffect(() => {
  const handleEscKey = (event) => {
   if (event.key === 'Escape' && isOpen) {
    handleClose();
   }
  };

  if (isOpen) {
   document.addEventListener('keydown', handleEscKey);
   return () => document.removeEventListener('keydown', handleEscKey);
  }
 }, [isOpen, handleClose]);

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
   <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
    <form onSubmit={handleSubmit} className="p-6">
     <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-gray-900">
       {editingDebt ? 'Edit Debt' : 'Add New Debt'}
      </h2>
      <button
       type="button"
       onClick={handleClose}
       className="text-gray-400 hover:text-gray-600 transition-colors"
      >
       <X className="w-5 h-5" />
      </button>
     </div>

     <div className="space-y-4">
      <FormField label="Debt Name" required>
       <Input
        placeholder="e.g. HSBC Credit Card"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
       />
      </FormField>

      <FormField label="Current Balance" required>
       <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
        <Input
         type="number"
         step="0.01"
         min="0"
         placeholder="1234.56"
         className="pl-8"
         value={formData.amount || ''}
         onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
         required
        />
       </div>
       <p className="text-sm text-gray-600 mt-1">
        Preview: {formatPounds(formData.amount || 0)}
       </p>
      </FormField>

      <FormField label="Original Balance (Optional)">
       <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
        <Input
         type="number"
         step="0.01"
         min="0"
         placeholder="5000.00"
         className="pl-8"
         value={formData.original_amount || ''}
         onChange={(e) => setFormData({...formData, original_amount: parseFloat(e.target.value) || undefined})}
        />
       </div>
       <div className="mt-1">
        {formData.original_amount && formData.amount && formData.original_amount > formData.amount ? (
         <p className="text-sm text-green-600">
          💪 Progress: {formatPounds(formData.original_amount - formData.amount)} paid off ({((formData.original_amount - formData.amount) / formData.original_amount * 100).toFixed(1)}% complete) {/* eslint-disable-line no-restricted-syntax */}
         </p>
        ) : formData.original_amount ? (
         <p className="text-sm text-gray-600">
          Preview: {formatPounds(formData.original_amount)} starting balance
         </p>
        ) : (
         <p className="text-sm text-gray-500">
          💡 Add your starting balance to track progress over time
         </p>
        )}
       </div>
      </FormField>

      <FormField label="APR (Annual Percentage Rate)" required>
       <div className="relative">
        <Input
         type="number"
         step="0.1"
         min="0"
         max="99.9"
         placeholder="19.9"
         value={formData.apr || ''}
         onChange={(e) => setFormData({...formData, apr: parseFloat(e.target.value) || 0})}
         required
        />
        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
       </div>
       <p className="text-sm text-gray-600 mt-1">
        Preview: {formatPercentage(formData.apr || 0)}
       </p>
      </FormField>

      <FormField label="Minimum Monthly Payment" required>
       <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
        <Input
         type="number"
         step="0.01"
         min="0"
         placeholder="45.00"
         className="pl-8"
         value={formData.min_payment || ''}
         onChange={(e) => setFormData({...formData, min_payment: parseFloat(e.target.value) || 0})}
         required
        />
       </div>
       <p className="text-sm text-gray-600 mt-1">
        Preview: {formatPounds(formData.min_payment || 0)}
       </p>
      </FormField>

      <FormField label="Credit Limit (Optional)">
       <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">£</span>
        <Input
         type="number"
         step="0.01"
         min="0"
         placeholder="5000.00"
         className="pl-8"
         value={formData.limit || ''}
         onChange={(e) => setFormData({...formData, limit: parseFloat(e.target.value) || undefined})}
        />
       </div>
       {formData.limit && (
        <p className="text-sm text-gray-600 mt-1">
         Preview: {formatPounds(formData.limit)}
        </p>
       )}
      </FormField>

      <FormField label="Debt Type">
       <select
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={formData.debt_type}
        onChange={(e) => setFormData({...formData, debt_type: e.target.value})}
       >
        <option value="credit_card">Credit Card</option>
        <option value="loan">Personal Loan</option>
        <option value="other">Other</option>
       </select>
      </FormField>
     </div>

     <div className="flex gap-3 mt-6">
      <Button
       type="button"
       variant="secondary"
       onClick={handleClose}
       disabled={loading}
       className="flex-1"
      >
       Cancel
      </Button>
      <Button
       type="submit"
       disabled={loading || !formData.name.trim()}
       className="flex-1 flex items-center justify-center gap-2"
      >
       <Check className="w-4 h-4" />
       {loading ? 'Saving...' : editingDebt ? 'Update' : 'Add Debt'}
      </Button>
     </div>
    </form>
   </div>
  </div>
 );
};

export default CleanDebtFormModal;