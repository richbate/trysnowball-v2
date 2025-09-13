/**
 * CP-5 Upgrade Prompt Component
 * Shows Pro upsell when users hit entitlement limits
 */

import React from 'react';
import { UserTier, EntitlementFeature, USER_TIERS } from '../types/Entitlements';
import { getEntitlementValue } from '../config/entitlements';

interface UpgradePromptProps {
  feature: EntitlementFeature;
  userTier: UserTier;
  currentUsage?: number;
  onClose: () => void;
  onUpgrade?: () => void;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  feature, 
  userTier, 
  currentUsage = 0,
  onClose, 
  onUpgrade 
}) => {

  // Get feature-specific messaging
  const getFeatureMessage = () => {
    if (feature === 'goals.max_active') {
      const freeLimit = getEntitlementValue(feature, USER_TIERS.FREE) as number;
      const proLimit = getEntitlementValue(feature, USER_TIERS.PRO) as number;
      
      return {
        title: 'Goal Limit Reached',
        description: `You've reached the limit of ${freeLimit} active goal for free users.`,
        benefit: `Upgrade to Pro to create up to ${proLimit} active goals and unlock advanced goal types.`,
        icon: (
          <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }

    if (feature === 'goals.allowed_types') {
      return {
        title: 'Goal Type Restricted',
        description: 'This goal type is only available for Pro users.',
        benefit: 'Upgrade to Pro to access all goal types: debt clearance, amount paid, interest saved, and timebound goals.',
        icon: (
          <svg className="w-8 h-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m8-7a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }

    // Default message
    return {
      title: 'Pro Feature',
      description: 'This feature is available for Pro users.',
      benefit: 'Upgrade to Pro to unlock all advanced features.',
      icon: (
        <svg className="w-8 h-8 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    };
  };

  const message = getFeatureMessage();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default upgrade action - redirect to billing page
      window.location.href = '/billing';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mb-4">
            {message.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {message.title}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {message.description}
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {message.benefit}
            </p>
          </div>
        </div>

        {/* Pro Benefits */}
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-purple-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Pro Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Up to 10 active goals
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All goal types (debt clearance, amount paid, interest saved, timebound)
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Advanced bucket targeting
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Intelligent challenge suggestions
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7-293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium transition-all transform hover:scale-105"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;