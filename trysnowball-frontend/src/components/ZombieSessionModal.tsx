/**
 * ZombieSessionModal - Production-Grade Session Recovery
 * Handles zombie session states with comprehensive tracking and recovery options
 */

import React from 'react';
import { AlertTriangle, LogIn, Wifi, WifiOff, X, Loader } from 'lucide-react';

interface Props {
 isVisible: boolean;
 localDataCount: number;
 recoveryInProgress: boolean;
 onReauth: () => void;
 onContinueOffline: () => void;
 onDismiss: () => void;
}

const ZombieSessionModal: React.FC<Props> = ({
 isVisible,
 localDataCount,
 recoveryInProgress,
 onReauth,
 onContinueOffline,
 onDismiss,
}) => {
 if (!isVisible) return null;

 return (
  <>
   {/* Backdrop */}
   <div className="fixed inset-0 bg-black/50 z-[200] animate-fadeIn" />
   
   {/* Modal */}
   <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full animate-slideUp">
     
     {/* Header */}
     <div className="flex items-start gap-4 p-6 pb-4">
      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
       <AlertTriangle className="w-6 h-6 text-orange-600" />
      </div>
      
      <div className="flex-1">
       <h2 className="text-xl font-bold text-gray-900 mb-2">
        Session Expired
       </h2>
       <p className="text-sm text-gray-600 leading-relaxed">
        Your login session has expired, but you have{' '}
        <span className="font-medium text-gray-900">
         {localDataCount} debt{localDataCount !== 1 ? 's' : ''}
        </span>{' '}
        stored locally. To continue syncing to the cloud, please log in again.
       </p>
      </div>

      <button
       onClick={onDismiss}
       className="text-gray-400 hover:text-gray-600 p-1 rounded flex-shrink-0 transition-colors"
       aria-label="Close"
      >
       <X className="w-5 h-5" />
      </button>
     </div>

     {/* Recovery Options */}
     <div className="px-6 pb-6">
      <div className="space-y-3">
       
       {/* Primary Action: Re-login */}
       <button
        onClick={onReauth}
        disabled={recoveryInProgress}
        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
       >
        {recoveryInProgress ? (
         <>
          <Loader className="w-5 h-5 animate-spin" />
          Redirecting to login...
         </>
        ) : (
         <>
          <LogIn className="w-5 h-5" />
          Log In to Restore Sync
         </>
        )}
       </button>
       
       {/* Secondary Action: Continue Offline */}
       <button
        onClick={onContinueOffline}
        className="w-full flex items-center justify-center gap-3 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
       >
        <WifiOff className="w-5 h-5" />
        Continue Working Offline
       </button>
      </div>
      
      {/* Info Footer */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
       <div className="flex items-start gap-2">
        <Wifi className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-800 leading-relaxed">
         <strong>Cloud Sync:</strong> Your changes will be saved across all devices when you log in. 
         <strong> Offline Mode:</strong> Changes stay on this device only.
        </div>
       </div>
      </div>
     </div>
    </div>
   </div>
  </>
 );
};

export default ZombieSessionModal;