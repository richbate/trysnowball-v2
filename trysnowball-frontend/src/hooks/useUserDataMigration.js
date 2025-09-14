import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { apiFetch } from '../utils/api';

/**
 * Hook for migrating user data from localStorage to D1 database
 * 
 * This runs automatically when:
 * 1. User is authenticated 
 * 2. Has localStorage data
 * 3. Migration hasn't been completed yet
 */
export function useUserDataMigration() {
 const { user, authReady } = useAuth();
 const [migrationState, setMigrationState] = useState({
  isChecking: false,
  isMigrating: false,
  isComplete: false,
  error: null,
  migratedData: null
 });

 // Check what localStorage data exists
 const getLocalStorageData = useCallback(() => {
  const safeParseJSON = (key, defaultValue = []) => {
   try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
   } catch (error) {
    console.warn(`Failed to parse localStorage item '${key}':`, error);
    // Try to clear the corrupted data
    try {
     localStorage.removeItem(key);
     console.log(`Cleared corrupted localStorage item: ${key}`);
    } catch (clearError) {
     console.warn(`Failed to clear corrupted item ${key}:`, clearError);
    }
    return defaultValue;
   }
  };

  try {
   const debts = safeParseJSON('ts_debts', []);
   const snapshots = safeParseJSON('ts_snapshots', []);
   const snowflakes = safeParseJSON('ts_snowflakes', []);
   const goals = safeParseJSON('ts_goals', []);
   const commitments = safeParseJSON('ts_commitments', []);

   return {
    debts,
    snapshots, 
    snowflakes,
    goals,
    commitments,
    hasData: debts.length > 0 || snapshots.length > 0 || snowflakes.length > 0 || goals.length > 0 || commitments.length > 0
   };
  } catch (error) {
   console.error('Error reading localStorage data:', error);
   return { hasData: false };
  }
 }, []);

 // Perform the migration
 const migrateData = useCallback(async () => {
  if (!user) return;

  setMigrationState(prev => ({ 
   ...prev, 
   isMigrating: true, 
   error: null 
  }));

  try {
   const localData = getLocalStorageData();
   
   if (!localData.hasData) {
    console.log('No localStorage data to migrate');
    setMigrationState(prev => ({ 
     ...prev, 
     isMigrating: false, 
     isComplete: true 
    }));
    return;
   }

   console.log('Starting migration...', {
    debts: localData.debts.length,
    snapshots: localData.snapshots.length,
    snowflakes: localData.snowflakes.length
   });

   const response = await apiFetch('/api/user/migrate', {
    method: 'POST',
    body: JSON.stringify(localData)
   });

   if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Migration failed');
   }

   const result = await response.json();
   
   console.log('✅ Migration successful:', result);

   // Mark migration as complete
   setMigrationState({
    isChecking: false,
    isMigrating: false,
    isComplete: true,
    error: null,
    migratedData: result.migrated
   });

   // Optionally clear localStorage after successful migration
   // We'll keep it for now as a backup
   console.log('Migration complete. localStorage data preserved as backup.');

  } catch (error) {
   console.error('Migration failed:', error);
   setMigrationState(prev => ({
    ...prev,
    isMigrating: false,
    error: error.message
   }));
  }
 }, [user, getLocalStorageData]);

 // Check migration status when user logs in
 const checkMigrationStatus = useCallback(async () => {
  if (!user) return;

  setMigrationState(prev => ({ 
   ...prev, 
   isChecking: true, 
   error: null 
  }));

  try {
   // Check if migration already completed (user has data_migrated_at)
   const response = await apiFetch('/auth/me');

   if (response.ok) {
    let userData;
    try {
     const responseText = await response.text();
     if (!responseText || responseText.trim() === '') {
      console.warn('Migration check: Empty response from /auth/me');
      userData = {};
     } else {
      userData = JSON.parse(responseText);
     }
    } catch (jsonError) {
     console.error('Migration check: Failed to parse JSON from /auth/me:', jsonError);
     console.error('Response status:', response.status);
     console.error('Response headers:', response.headers);
     // Skip migration check if API is not working properly
     setMigrationState(prev => ({ 
      ...prev, 
      isChecking: false, 
      isComplete: true 
     }));
     return;
    }
    
    if (userData.user?.data_migrated_at) {
     console.log('Migration already completed at:', userData.user.data_migrated_at);
     setMigrationState({
      isChecking: false,
      isMigrating: false,
      isComplete: true,
      error: null,
      migratedData: null
     });
     return;
    }
   } else {
    console.warn(`Migration check: /auth/me returned ${response.status}`);
    // Continue with migration check even if API call fails
   }

   // Check if we have localStorage data to migrate
   const localData = getLocalStorageData();
   
   if (localData.hasData) {
    console.log('Found localStorage data, starting migration...');
    await migrateData();
   } else {
    console.log('No localStorage data found');
    setMigrationState(prev => ({ 
     ...prev, 
     isChecking: false, 
     isComplete: true 
    }));
   }

  } catch (error) {
   console.error('Migration check failed:', error);
   setMigrationState(prev => ({
    ...prev,
    isChecking: false,
    error: error.message
   }));
  }
 }, [user, getLocalStorageData, migrateData]);

 // Auto-trigger migration check when user logs in
 useEffect(() => {
  if (authReady && user && !migrationState.isComplete && !migrationState.isChecking) {
   console.log('User logged in, checking migration status...');
   checkMigrationStatus();
  }
 }, [authReady, user, migrationState.isComplete, migrationState.isChecking, checkMigrationStatus]);

 return {
  ...migrationState,
  retryMigration: migrateData,
  checkMigrationStatus
 };
}

export default useUserDataMigration;