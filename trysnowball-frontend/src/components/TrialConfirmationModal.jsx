import React from 'react';
import { Check, X, Crown } from 'lucide-react';
import Button from './ui/Button';

const TrialConfirmationModal = ({ 
 isOpen, 
 onConfirm, 
 onCancel, 
 planType = 'annual',
 trialEndDate = null 
}) => {
 
 if (!isOpen) return null;

 const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-GB', {
   weekday: 'long',
   year: 'numeric',
   month: 'long',
   day: 'numeric'
  }).format(new Date(date));
 };

 const trialExpiry = trialEndDate ? formatDate(trialEndDate) : formatDate(Date.now() + 7 * 24 * 60 * 60 * 1000);

 const proFeatures = [
  'Unlimited debt forecasting & "what-if" scenarios',
  'Snowflakes & extra payment tracking', 
  'Milestone celebrations & social sharing',
  'Unlimited AI Coach (Yuki) conversations',
  'Export your data anytime',
  'Priority support'
 ];

 return (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
   <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="p-6 border-b border-gray-200 ">
     <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
       <Crown className="w-8 h-8 text-yellow-500" />
       <div>
        <h2 className="text-xl font-bold text-gray-900 ">
         Try Snowball Pro for Free!
        </h2>
        <p className="text-sm text-gray-600 ">
         7-day free trial • No card required
        </p>
       </div>
      </div>
      <button
       onClick={onCancel}
       className="text-gray-400 hover:text-gray-600 transition-colors"
      >
       <X className="w-6 h-6" />
      </button>
     </div>
    </div>

    {/* Content */}
    <div className="p-6">
     <p className="text-gray-700 mb-6">
      You're eligible for a 7-day free trial of Snowball Pro. Unlock premium features and accelerate your debt-free journey:
     </p>

     {/* Features List */}
     <div className="space-y-3 mb-6">
      {proFeatures.map((feature, index) => (
       <div key={index} className="flex items-start space-x-3">
        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        <span className="text-sm text-gray-700 ">{feature}</span>
       </div>
      ))}
     </div>

     {/* Trial Info */}
     <div className="bg-blue-50 rounded-lg p-4 mb-6">
      <p className="text-sm text-blue-800 ">
       <strong>Your trial will end on {trialExpiry}</strong>
      </p>
      <p className="text-xs text-blue-600 mt-1">
       You can cancel anytime during your trial with no charges.
      </p>
     </div>

     {/* Action Buttons */}
     <div className="flex space-x-3">
      <Button
       onClick={onConfirm}
       className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
      >
       Start Free Trial
      </Button>
      <Button
       onClick={onCancel}
       variant="outline"
       className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
      >
       Maybe Later
      </Button>
     </div>

     {/* Fine Print */}
     <p className="text-xs text-gray-500 mt-4 text-center">
      After your trial ends, continue with Pro for just £{planType === 'annual' ? '19.99/year' : '4.99/month'}.
     </p>
    </div>
   </div>
  </div>
 );
};

export default TrialConfirmationModal;