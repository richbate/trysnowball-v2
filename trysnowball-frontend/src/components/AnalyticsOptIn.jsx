import React, { useState, useEffect } from 'react';
import { Shield, BarChart3, Info } from 'lucide-react';
import { setAnalyticsOptIn, isAnalyticsEnabled } from '../utils/secureAnalytics';

const AnalyticsOptIn = () => {
 const [isEnabled, setIsEnabled] = useState(false);
 const [showInfo, setShowInfo] = useState(false);

 useEffect(() => {
  setIsEnabled(isAnalyticsEnabled());
 }, []);

 const handleToggle = () => {
  const newValue = !isEnabled;
  setIsEnabled(newValue);
  setAnalyticsOptIn(newValue);

  // Reload PostHog if enabling
  if (newValue && typeof window !== 'undefined') {
   import('../lib/posthog').then(({ initPostHog }) => {
    initPostHog();
   });
  }
 };

 return (
  <div className="bg-white rounded-lg shadow p-6">
   <div className="flex items-start justify-between">
    <div className="flex-1">
     <div className="flex items-center gap-3 mb-2">
      <Shield className="w-5 h-5 text-green-600 " />
      <h3 className="text-lg font-semibold text-gray-900 ">
       Privacy-First Analytics
      </h3>
     </div>
     
     <p className="text-sm text-gray-600 mb-4">
      Help improve TrySnowball by sharing de-identified usage data. 
      We <strong>never</strong> share your actual debt amounts or creditor names.
     </p>

     <div className="flex items-center gap-4">
      <label className="flex items-center cursor-pointer">
       <input
        type="checkbox"
        checked={isEnabled}
        onChange={handleToggle}
        className="sr-only"
       />
       <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isEnabled ? 'bg-blue-600' : 'bg-gray-300'
       }`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
         isEnabled ? 'translate-x-6' : 'translate-x-1'
        }`} />
       </div>
       <span className="ml-3 text-sm font-medium text-gray-900 ">
        {isEnabled ? 'Sharing enabled' : 'Sharing disabled'}
       </span>
      </label>

      <button
       onClick={() => setShowInfo(!showInfo)}
       className="p-2 text-gray-400 hover:text-gray-600 "
       aria-label="More information"
      >
       <Info className="w-4 h-4" />
      </button>
     </div>
    </div>

    <BarChart3 className="w-8 h-8 text-gray-300 " />
   </div>

   {showInfo && (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ">
     <h4 className="font-semibold text-sm text-blue-900 mb-2">
      What we collect (when enabled):
     </h4>
     <ul className="text-xs text-blue-800 space-y-1">
      <li>• <strong>Amount bands</strong> (e.g., "£2k-£5k" not exact amounts)</li>
      <li>• <strong>Debt types</strong> (credit card, loan, etc.)</li>
      <li>• <strong>Hashed issuer IDs</strong> (anonymized, not reversible)</li>
      <li>• <strong>Usage patterns</strong> (features used, not personal data)</li>
     </ul>
     
     <h4 className="font-semibold text-sm text-blue-900 mt-3 mb-2">
      What we NEVER collect:
     </h4>
     <ul className="text-xs text-blue-800 space-y-1">
      <li>• Exact debt amounts or balances</li>
      <li>• Actual creditor/issuer names</li>
      <li>• Account numbers or personal details</li>
      <li>• Interest rates or payment amounts</li>
      <li>• Any notes or comments you add</li>
     </ul>

     <div className="mt-3 p-2 bg-green-100 rounded border border-green-300 ">
      <p className="text-xs text-green-800 ">
       <strong>GDPR Compliant:</strong> Data stored in EU, you can disable anytime, 
       and we use PostHog's privacy-first EU infrastructure.
      </p>
     </div>
    </div>
   )}
  </div>
 );
};

export default AnalyticsOptIn;