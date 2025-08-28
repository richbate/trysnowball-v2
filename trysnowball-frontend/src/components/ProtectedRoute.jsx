/**
 * Protected Route Component
 * Ensures users have debts or are in demo mode before accessing dashboard
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useDebts } from '../hooks/useDebts';
import { useDemoMode } from '../providers/DemoModeProvider';
import PageSkeleton from './PageSkeleton';

const ProtectedRoute = ({ children }) => {
  const { user, authReady } = useAuth();
  const { debts, loading: debtsLoading } = useDebts();
  const { isDemo } = useDemoMode();
  
  // Show loading while auth/debts are loading
  if (!authReady || debtsLoading) {
    return <PageSkeleton />;
  }
  
  // Not logged in and not in demo -> show landing page directly
  if (!user && !isDemo) {
    const Landing = React.lazy(() => import('../pages/Landing'));
    return (
      <React.Suspense fallback={<PageSkeleton />}>
        <Landing />
      </React.Suspense>
    );
  }
  
  // Logged in but no debts and not in demo -> go to onboarding
  if (user && (!debts || debts.length === 0) && !isDemo) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Has debts or is in demo -> show dashboard
  return children;
};

export default ProtectedRoute;