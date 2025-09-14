import React, { useState } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';
import { toCents, fromCents } from '../lib/money';

export default function RecordPaymentModal({ 
 isOpen, 
 debt, 
 onSave, 
 onClose, 
 loading = false 
}) {
 const [amount, setAmount] = useState('');
 const [paymentType, setPaymentType] = useState('extra');
 const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
 const [notes, setNotes] = useState('');
 const [errors, setErrors] = useState({});
 const [isSubmitting, setIsSubmitting] = useState(false);

 if (!isOpen) return null;

 const validateForm = () => {
  const newErrors = {};
  const amountValue = parseFloat(amount);
  const debtBalance = fromCents(debt?.amount_pennies || 0);
  
  // Amount validation
  if (!amount || amount.trim() === '') {
   newErrors.amount = 'Payment amount is required';
  } else if (isNaN(amountValue) || amountValue <= 0) {
   newErrors.amount = 'Payment amount must be greater than £0';
  } else if (amountValue > debtBalance) {
   newErrors.amount = `Payment cannot exceed debt balance of £${debtBalance.toLocaleString()}`;
  } else if (amountValue < 0.01) {
   newErrors.amount = 'Minimum payment amount is £0.01';
  }
  
  // Date validation
  if (!paymentDate) {
   newErrors.paymentDate = 'Payment date is required';
  } else {
   const paymentDateObj = new Date(paymentDate);
   const today = new Date();
   const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
   const oneMonthAhead = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
   
   if (paymentDateObj > oneMonthAhead) {
    newErrors.paymentDate = 'Payment date cannot be more than 1 month in the future';
   } else if (paymentDateObj < oneYearAgo) {
    newErrors.paymentDate = 'Payment date cannot be more than 1 year in the past';
   }
  }
  
  // Notes validation
  if (notes && notes.length > 500) {
   newErrors.notes = 'Notes must be 500 characters or less';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
 };

 const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (isSubmitting) return; // Prevent double submission
  
  if (!validateForm()) {
   return;
  }
  
  setIsSubmitting(true);
  setErrors({}); // Clear any previous errors
  
  try {
   const paymentAmount = parseFloat(amount);
   const paymentData = {
    debt_id: debt.id,
    amount_pennies: toCents(paymentAmount),
    payment_type: paymentType,
    payment_date: paymentDate,
    notes: notes.trim() || undefined
   };
   
   await onSave(paymentData);
   
   // Calculate new balance for success message
   const newBalance = fromCents(debt.amount_pennies) - paymentAmount;
   
   // Reset form
   setAmount('');
   setPaymentType('extra');
   setPaymentDate(new Date().toISOString().split('T')[0]);
   setNotes('');
   setErrors({});
   
   onClose();
  } catch (error) {
   console.error('Payment submission failed:', error);
   setErrors({ submit: error.message || 'Failed to record payment. Please try again.' });
  } finally {
   setIsSubmitting(false);
  }
 };

 const maxPayment = fromCents(debt?.amount_pennies || 0);

 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="payment-modal-overlay">
   <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
    <Card className="p-6">
     <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
      <button
       onClick={onClose}
       className="text-gray-400 hover:text-gray-600 text-xl"
       data-testid="close-payment-modal"
      >
       ×
      </button>
     </div>

     <div className="mb-4">
      <p className="text-sm text-gray-600">
       Recording payment for: <span className="font-medium text-gray-900">{debt?.name}</span>
      </p>
      <p className="text-sm text-gray-500">
       Current balance: £{maxPayment.toLocaleString()}
      </p>
     </div>

     <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Amount */}
      <div>
       <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 mb-1">
        Payment Amount (£)
       </label>
       <input
        id="payment-amount"
        type="number"
        step="0.01"
        min="0.01"
        max={maxPayment}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`
         w-full px-3 py-2 border rounded-md bg-white text-gray-900 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         ${errors.amount ? 'border-red-500' : 'border-gray-300'}
        `}
        placeholder="0.00"
        data-testid="payment-amount-input"
       />
       {errors.amount && (
        <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
       )}
      </div>

      {/* Payment Type */}
      <div>
       <label htmlFor="payment-type" className="block text-sm font-medium text-gray-700 mb-1">
        Payment Type
       </label>
       <select
        id="payment-type"
        value={paymentType}
        onChange={(e) => setPaymentType(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        data-testid="payment-type-select"
       >
        <option value="minimum">Minimum Payment</option>
        <option value="extra">Extra Payment</option>
        <option value="snowflake">Snowflake Payment</option>
        <option value="adjustment">Balance Adjustment</option>
       </select>
      </div>

      {/* Payment Date */}
      <div>
       <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 mb-1">
        Payment Date
       </label>
       <input
        id="payment-date"
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
        className={`
         w-full px-3 py-2 border rounded-md bg-white text-gray-900 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         ${errors.paymentDate ? 'border-red-500' : 'border-gray-300'}
        `}
        data-testid="payment-date-input"
       />
       {errors.paymentDate && (
        <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>
       )}
      </div>

      {/* Notes */}
      <div>
       <label htmlFor="payment-notes" className="block text-sm font-medium text-gray-700 mb-1">
        Notes (Optional)
       </label>
       <textarea
        id="payment-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={500}
        className={`
         w-full px-3 py-2 border rounded-md bg-white text-gray-900 
         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
         ${errors.notes ? 'border-red-500' : 'border-gray-300'}
        `}
        placeholder="Additional details about this payment..."
        data-testid="payment-notes-input"
       />
       <div className="flex justify-between items-center mt-1">
        {errors.notes && (
         <p className="text-red-500 text-sm">{errors.notes}</p>
        )}
        <p className={`text-xs ml-auto ${notes.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
         {notes.length}/500
        </p>
       </div>
      </div>

      {errors.submit && (
       <p className="text-red-500 text-sm">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
       <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={loading}
        data-testid="cancel-payment-button"
       >
        Cancel
       </Button>
       <Button
        type="submit"
        disabled={loading || isSubmitting}
        data-testid="record-payment-button"
       >
        {isSubmitting ? 'Recording...' : 'Record Payment'}
       </Button>
      </div>
     </form>
    </Card>
   </div>
  </div>
 );
}