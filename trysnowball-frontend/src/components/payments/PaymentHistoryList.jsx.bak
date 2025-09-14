/**
 * Payment History List Component
 * Collapsible list of payments for a specific debt
 */

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Calendar, DollarSign, FileText } from 'lucide-react';
import { localDebtStore } from '../../data/localDebtStore';
import { fromCents } from '../../lib/money';
import { secureAnalytics } from '../../utils/secureAnalytics';

const PaymentTypesBadges = {
 'minimum': { color: 'bg-gray-100 text-gray-700', label: 'Min' },
 'system_minimum': { color: 'bg-blue-100 text-blue-700', label: 'Min' },
 'extra': { color: 'bg-green-100 text-green-700', label: 'Extra' },
 'snowball_extra': { color: 'bg-purple-100 text-purple-700', label: 'Snowball' },
 'avalanche_extra': { color: 'bg-orange-100 text-orange-700', label: 'Avalanche' },
 'snowflake': { color: 'bg-cyan-100 text-cyan-700', label: 'Snowflake' },
 'adjustment': { color: 'bg-yellow-100 text-yellow-700', label: 'Adjust' }
};

function PaymentEntry({ payment }) {
 const typeConfig = PaymentTypesBadges[payment.payment_type] || PaymentTypesBadges.extra;
 const amount = fromCents(payment.amount_pennies || 0);
 const paymentDate = new Date(payment.payment_date).toLocaleDateString();

 return (
  <div className="flex items-center justify-between py-3 px-4 bg-white hover:bg-gray-50 rounded-lg border border-gray-200">
   <div className="flex items-center space-x-3">
    <div className="flex-shrink-0">
     <DollarSign className="h-5 w-5 text-green-600" />
    </div>
    <div>
     <div className="flex items-center space-x-2">
      <span className="font-medium text-gray-900">
       £{amount.toLocaleString()}
      </span>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.color}`}>
       {typeConfig.label}
      </span>
     </div>
     <div className="flex items-center space-x-2 text-sm text-gray-500">
      <Calendar className="h-4 w-4" />
      <span>{paymentDate}</span>
      {payment.notes && (
       <>
        <span>•</span>
        <div className="flex items-center space-x-1">
         <FileText className="h-4 w-4" />
         <span className="truncate max-w-48" title={payment.notes}>
          {payment.notes}
         </span>
        </div>
       </>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

function EmptyState() {
 return (
  <div className="text-center py-8 text-gray-500">
   <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
   <p className="text-sm">No payments recorded yet</p>
   <p className="text-xs text-gray-400 mt-1">
    Use the payment button to record your first payment
   </p>
  </div>
 );
}

export default function PaymentHistoryList({ debt, isOpen, onToggle }) {
 const [payments, setPayments] = useState([]);
 const [loading, setLoading] = useState(false);
 const [hasLoaded, setHasLoaded] = useState(false);

 useEffect(() => {
  if (isOpen && !hasLoaded) {
   loadPaymentHistory();
  }
 }, [isOpen, hasLoaded]);

 const loadPaymentHistory = async () => {
  if (!debt?.id || loading) return;

  setLoading(true);
  try {
   const paymentEntries = await localDebtStore.listPaymentEntries(debt.id);
   setPayments(paymentEntries || []);
   setHasLoaded(true);

   // Track analytics
   secureAnalytics.capturePaymentHistoryViewed({
    debt_id: debt.id,
    count: paymentEntries?.length || 0
   });
  } catch (error) {
   console.error('Failed to load payment history:', error);
   setPayments([]);
  } finally {
   setLoading(false);
  }
 };

 const handleToggle = () => {
  onToggle();
  if (!isOpen && !hasLoaded) {
   // Will trigger useEffect to load data
  }
 };

 return (
  <div className="border-t border-gray-100">
   <button
    onClick={handleToggle}
    className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
   >
    <div className="flex items-center space-x-2">
     <span className="text-sm font-medium text-gray-700">Payment History</span>
     {payments.length > 0 && (
      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
       {payments.length}
      </span>
     )}
    </div>
    <div className="flex items-center space-x-2 text-gray-400">
     {loading && (
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
     )}
     {isOpen ? (
      <ChevronUp className="h-5 w-5" />
     ) : (
      <ChevronDown className="h-5 w-5" />
     )}
    </div>
   </button>

   {isOpen && (
    <div className="px-4 pb-4">
     <div className="bg-gray-50 rounded-lg p-4">
      {loading ? (
       <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-2">Loading payments...</p>
       </div>
      ) : payments.length > 0 ? (
       <div className="space-y-2">
        <div className="flex justify-between items-center mb-3">
         <h4 className="text-sm font-medium text-gray-900">
          Recent Payments
         </h4>
         <div className="text-sm text-gray-500">
          Total: £{payments.reduce((sum, p) => sum + fromCents(p.amount_pennies || 0), 0).toLocaleString()}
         </div>
        </div>
        {payments.map((payment) => (
         <PaymentEntry key={payment.id} payment={payment} />
        ))}
       </div>
      ) : (
       <EmptyState />
      )}
     </div>
    </div>
   )}
  </div>
 );
}