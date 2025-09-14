import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUserDebts } from '../hooks/useUserDebts';
import { computePlanLandingPath } from '../utils/planRouting';

export default function RootRoute() {
 const navigate = useNavigate();
 const { pathname } = useLocation();
 const { hasDebts, hydrationStatus } = useUserDebts();

 useEffect(() => {
  // only redirect when actually at "/"
  if (pathname !== '/') return;
  
  // Wait until debts have finished hydrating
  if (hydrationStatus !== 'ready') return;

  console.log('RootRoute: Deciding route after hydration:', { hasDebts, hydrationStatus });

  const path = computePlanLandingPath(hasDebts);
  
  console.log('RootRoute: Navigating to', path, { hasDebts });
  navigate(path, { replace: true });
 }, [pathname, hasDebts, hydrationStatus, navigate]);

 // Tiny placeholder to avoid blank flashes during the redirect
 return (
  <div className="p-6 text-gray-500 flex items-center justify-center">
   <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p>Loading your dashboard...</p>
   </div>
  </div>
 );
}