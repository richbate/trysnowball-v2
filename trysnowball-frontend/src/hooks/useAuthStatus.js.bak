import { useAuth } from '../contexts/AuthContext.tsx';

export function useAuthStatus() {
 const { authReady, user, isAuthenticated } = useAuth();

 // 🚨 CRITICAL: Runtime safety check for auth state corruption
 if (user && isAuthenticated === undefined) {
  console.error('🚨 [AuthContext] CRITICAL BUG: user exists but isAuthenticated is undefined!');
  console.error('This will cause D1 sync failures and data loss.');
 }

 // Map AuthContext state to useAuthStatus format
 let status;
 if (!authReady) {
  status = 'checking';
 } else if (isAuthenticated) {
  status = 'authenticated';
 } else {
  status = 'anonymous';
 }

 return { status, user };
}