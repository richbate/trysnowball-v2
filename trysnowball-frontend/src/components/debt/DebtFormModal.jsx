import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import { Check, X } from 'lucide-react';
import { fromCents, bpsToPercent } from '../../lib/money';

const DebtFormModal = ({ isOpen, onClose, onSave, editingDebt, loading }) => {
 const [formData, setFormData] = useState({
  name: '', 
  balance: '', 
  interestRate: 20, 
  minPayment: '', 
  limit: '',
  order: 1
 });

 // Update form when editing debt changes
 useEffect(() => {
  if (editingDebt) {
   setFormData({
    name: editingDebt.name ?? '',
    balance: (editingDebt.amount ?? 0).toString(),
    interestRate: editingDebt.apr ?? 20,
    minPayment: (editingDebt.min_payment ?? 0).toString(),
    limit: editingDebt.limit ? editingDebt.limit.toString() : '',
    order: Number.isFinite(editingDebt.order_index) ? editingDebt.order_index + 1 : 1
   });
  } else {
   setFormData({
    name: '', 
    balance: '', 
    interestRate: 20, 
    minPayment: '', 
    limit: '',
    order: ''
   });
  }
 }, [editingDebt]);

 const handleClose = useCallback(() => {
  setFormData({ name: '', balance: '', interestRate: 20, minPayment: '', limit: '', order: 1 });
  onClose();
 }, [onClose]);

 // Add ESC key listener to close modal
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

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  // CRITICAL: Log immediately at top of function
  console.warn('🚨🚨🚨 FORM SUBMIT HANDLER CALLED 🚨🚨🚨');
  console.warn('🔍 [FORM] Raw formData object:', formData);
  console.log('🔍 [FORM] handleSubmit called with formData:', formData);
  console.log('🔍 [FORM] formData keys:', Object.keys(formData));
  console.log('🔍 [FORM] formData values:', Object.values(formData));
  console.log('🔍 [FORM] Validation check - name:', !!formData.name, 'balance:', !!formData.balance, 'minPayment:', !!formData.minPayment);
  
  // Form field names are intentionally in display format, converted to normalized below
  // eslint-disable-next-line no-restricted-syntax
  if (!formData.name || !formData.balance || !formData.minPayment) {
   console.error('🚨 [FORM] Validation failed - early return!');
   return;
  }

  console.log('🔍 [FORM] Raw form data:', formData);
  console.log('🔍 [FORM] *** FORM SUBMIT TRIGGERED ***');
  
  // Clean UK format - no conversions needed
  const formPayload = {
   name: formData.name,
   debt_type: formData.limit ? 'credit_card' : 'loan',
   amount: parseFloat(formData.balance) || 0,
   apr: parseFloat(formData.interestRate) || 0,
   min_payment: parseFloat(formData.minPayment) || 0,
   is_demo: false
  };
  
  console.log('🔍 [FORM] Converted payload before optional fields:', formPayload);
  
  // Only add optional fields if they have values
  if (editingDebt?.id) {
   formPayload.id = editingDebt.id;
  }
  if (formData.limit) {
   formPayload.limit = parseFloat(formData.limit) || 0;
  }
  if (formData.order) {
   formPayload.order_index = Number(formData.order) - 1; // Convert from 1-based display to 0-based storage
  }
  
  // Set original amount for new debts
  if (!editingDebt?.id) {
   formPayload.original_amount = formPayload.amount;
  }
  
  console.log('🔍 [FORM] Final payload to send:', formPayload);
  
  // Check for any undefined values
  Object.entries(formPayload).forEach(([key, value]) => {
   if (value === undefined) {
    console.error(`🚨 [FORM] UNDEFINED VALUE: ${key} = ${value}`);
   }
  });

  try {
   await onSave(formPayload);
   
   // Success: Close modal and reset form
   handleClose();
  } catch (error) {
   console.error('Error saving debt:', error);
   // Don't close modal on error so user can retry
  }
 };

 // handleClose moved above to be used in useEffect

 if (!isOpen) return null;

 return (
  <div 
   className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 select-none"
   onClick={handleClose}
   onKeyDown={(e) => e.key === 'Escape' && handleClose()}
   role="dialog"
   aria-modal="true"
  >
   <div 
    className="bg-white rounded-xl p-4 sm:p-8 max-w-lg w-full h-auto max-h-[85vh] overflow-y-auto relative"
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => e.stopPropagation()}
    role="document"
   >
    <div className="sticky top-0 bg-white pb-4 mb-2">
     <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">
      {editingDebt ? 'Update Debt' : 'Add Debt'}
     </h3>
    </div>
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
     <FormField
      label="Name"
      required
     >
      <Input
       type="text"
       value={formData.name}
       onChange={(e) => {
        setFormData({...formData, name: e.target.value});
       }}
       placeholder="e.g., Credit Card, Car Loan"
       required
       autoComplete="off"
       spellCheck="false"
      />
     </FormField>
     <FormField
      label="Balance"
      required
     >
      <Input
       type="number"
       className="appearance-none"
       value={formData.balance}
       // eslint-disable-next-line no-restricted-syntax
       onChange={(e) => setFormData({...formData, balance: e.target.value})}
       placeholder="2500"
       min="0"
       step="0.01"
       required
      />
     </FormField>
     <FormField
      label="Interest Rate"
     >
      <Input
       type="number"
       className="appearance-none"
       value={formData.interestRate}
       // eslint-disable-next-line no-restricted-syntax
       onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
       placeholder="20"
       min="0"
       max="50"
       step="0.1"
      />
     </FormField>
     <FormField
      label="Minimum Payment"
      required
     >
      <Input
       type="number"
       className="appearance-none"
       value={formData.minPayment}
       // eslint-disable-next-line no-restricted-syntax
       onChange={(e) => setFormData({...formData, minPayment: e.target.value})}
       placeholder="75"
       min="0"
       step="0.01"
       required
      />
     </FormField>
     <FormField
      label="Focus Order"
      hint="Optional: Which debt to attack first (auto-ordered by strategy if blank)"
     >
      <Input
       type="number"
       className="appearance-none"
       value={formData.order}
       onChange={(e) => setFormData({...formData, order: e.target.value})}
       placeholder="Auto (leave blank)"
       min="1"
      />
     </FormField>
     <FormField
      label="Credit Limit"
      hint="Credit cards and overdrafts (optional)"
     >
      <Input
       type="number"
       className="appearance-none"
       value={formData.limit}
       onChange={(e) => setFormData({...formData, limit: e.target.value})}
       placeholder="5000"
       min="0"
       step="0.01"
      />
     </FormField>
     <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6 sticky bottom-0 bg-white pb-2">
      <Button
       type="submit"
       disabled={loading}
       loading={loading}
       variant="primary"
       size="lg"
       className="flex-1"
       leftIcon={!loading ? Check : undefined}
      >
       {loading ? (editingDebt ? 'Updating...' : 'Adding...') : (editingDebt ? 'Update Debt' : 'Add Debt')}
      </Button>
      <Button
       type="button"
       onClick={handleClose}
       variant="muted"
       size="lg"
       className="flex-1"
       leftIcon={X}
      >
       Cancel
      </Button>
     </div>
    </form>
   </div>
  </div>
 );
};

export default DebtFormModal;