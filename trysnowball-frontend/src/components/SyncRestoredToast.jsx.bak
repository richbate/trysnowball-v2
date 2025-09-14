/**
 * Sync Restored Success Toast
 * Shows confirmation when D1 sync is successfully working after being restored
 */

import React, { useState, useEffect } from 'react';
import { Cloud, X, CheckCircle } from 'lucide-react';

const SyncRestoredToast = ({ onClose }) => {
 const [isVisible, setIsVisible] = useState(true);

 const handleClose = () => {
  setIsVisible(false);
  setTimeout(() => {
   onClose && onClose();
  }, 300);
 };

 // Auto-dismiss after 4 seconds
 useEffect(() => {
  const timer = setTimeout(handleClose, 4000);
  return () => clearTimeout(timer);
 }, [handleClose]);

 if (!isVisible) return null;

 return (
  <div className="fixed top-4 right-4 z-[100] max-w-sm">
   <div 
    className={`transform transition-all duration-300 ease-out ${
     isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
    }`}
   >
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
     <div className="flex items-start gap-3">
      {/* Icon */}
      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
       <Cloud className="w-4 h-4 text-green-600" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
       <div className="flex items-center gap-2 mb-1">
        <h3 className="text-lg font-bold text-gray-900">
         Sync Restored!
        </h3>
        <CheckCircle className="w-4 h-4 text-green-500" />
       </div>
       <p className="text-sm text-gray-700">
        🔄 Your debts are now syncing to the cloud and will be saved across all your devices.
       </p>
      </div>
      
      {/* Close Button */}
      <button
       onClick={handleClose}
       className="text-gray-400 hover:text-gray-600 p-1 rounded flex-shrink-0"
      >
       <X className="w-4 h-4" />
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default SyncRestoredToast;