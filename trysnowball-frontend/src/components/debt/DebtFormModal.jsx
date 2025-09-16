import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Input from '../ui/Input';
import { Check, X } from 'lucide-react';

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
        name: editingDebt.name,
        balance: (editingDebt.balance || editingDebt.amount || 0).toString(),
        interestRate: editingDebt.interestRate || editingDebt.interest || 20,
        minPayment: (editingDebt.minPayment || editingDebt.regularPayment || 0).toString(),
        limit: editingDebt.limit?.toString() || '',
        order: editingDebt.order || 1
      });
    } else {
      setFormData({
        name: '', 
        balance: '', 
        interestRate: 20, 
        minPayment: '', 
        limit: '',
        order: 1
      });
    }
  }, [editingDebt]);

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
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.balance || !formData.minPayment) return;

    const debtData = {
      name: formData.name,
      balance: parseFloat(formData.balance),
      interestRate: formData.interestRate === '' ? 20 : parseFloat(formData.interestRate),
      minPayment: parseFloat(formData.minPayment),
      limit: formData.limit ? parseFloat(formData.limit) : null,
      order: parseInt(formData.order) || 1,
      type: formData.limit ? 'Credit Card' : 'Loan'
    };

    try {
      await onSave(debtData, editingDebt);
      
      // Success: Close modal and reset form
      handleClose();
    } catch (error) {
      console.error('Error saving debt:', error);
      // Don't close modal on error so user can retry
    }
  };

  const handleClose = () => {
    setFormData({ name: '', balance: '', interestRate: 20, minPayment: '', limit: '', order: 1 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl p-4 sm:p-8 max-w-lg w-full max-h-full overflow-y-auto my-4 sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-slate-900">
          {editingDebt ? 'Update Debt' : 'Add Debt'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <FormField
            label="Name"
            required
          >
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => {
                console.log('Name input change:', e.target.value);
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
              value={formData.balance}
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
              value={formData.interestRate}
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
              value={formData.minPayment}
              onChange={(e) => setFormData({...formData, minPayment: e.target.value})}
              placeholder="75"
              min="0"
              step="0.01"
              required
            />
          </FormField>
          <FormField
            label="Focus Order"
            hint="Which debt to attack first (1 = highest priority)"
            required
          >
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({...formData, order: e.target.value})}
              placeholder="1"
              min="1"
              required
            />
          </FormField>
          <FormField
            label="Credit Limit"
            hint="Credit cards and overdrafts (optional)"
          >
            <Input
              type="number"
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