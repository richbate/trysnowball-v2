import React from 'react';
import { AlertCircle, CheckCircle, Loader, Database } from 'lucide-react';
import { useUserDataMigration } from '../hooks/useUserDataMigration';

/**
 * Component that handles user data migration from localStorage to D1
 * Shows migration status and handles errors
 */
export function UserDataMigration() {
 const { 
  isChecking, 
  isMigrating, 
  isComplete, 
  error, 
  migratedData,
  retryMigration 
 } = useUserDataMigration();

 // Don't render anything if migration is complete and there's no error
 if (isComplete && !error) {
  return null;
 }

 return (
  <div className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
   <div className="max-w-4xl mx-auto px-4 py-3">
    
    {/* Checking migration status */}
    {isChecking && (
     <div className="flex items-center space-x-3">
      <Loader className="h-5 w-5 text-blue-600 animate-spin" />
      <div>
       <p className="text-sm font-medium text-gray-900">
        Checking your account setup...
       </p>
       <p className="text-xs text-gray-600">
        This will only take a moment
       </p>
      </div>
     </div>
    )}

    {/* Migration in progress */}
    {isMigrating && (
     <div className="flex items-center space-x-3">
      <Database className="h-5 w-5 text-blue-600" />
      <div>
       <p className="text-sm font-medium text-gray-900">
        Setting up your account with cloud sync...
       </p>
       <p className="text-xs text-gray-600">
        Moving your data to secure cloud storage
       </p>
      </div>
      <div className="flex-1" />
      <Loader className="h-4 w-4 text-blue-600 animate-spin" />
     </div>
    )}

    {/* Migration successful */}
    {isComplete && migratedData && (
     <div className="flex items-center space-x-3 bg-green-50 p-3 rounded-lg">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <div>
       <p className="text-sm font-medium text-green-900">
        ✅ Account setup complete!
       </p>
       <p className="text-xs text-green-700">
        {migratedData.debts?.length || 0} debts synced to cloud storage. 
        Your data is now available on all your devices.
       </p>
      </div>
     </div>
    )}

    {/* Migration error */}
    {error && (
     <div className="flex items-center space-x-3 bg-red-50 p-3 rounded-lg">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div className="flex-1">
       <p className="text-sm font-medium text-red-900">
        Setup failed
       </p>
       <p className="text-xs text-red-700">
        {error}
       </p>
      </div>
      <button
       onClick={retryMigration}
       className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
      >
       Retry
      </button>
     </div>
    )}

   </div>
  </div>
 );
}

export default UserDataMigration;