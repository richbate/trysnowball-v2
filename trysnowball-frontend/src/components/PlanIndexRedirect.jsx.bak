import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserDebts } from '../hooks/useUserDebts';
import { computePlanLandingPath } from '../utils/planRouting';

export default function PlanIndexRedirect() {
 const navigate = useNavigate();
 const { hasDebts, hydrationStatus } = useUserDebts();
 
 useEffect(() => {
  // Wait until debts have finished hydrating
  if (hydrationStatus !== 'ready') return;
  
  const path = computePlanLandingPath(hasDebts);
  console.log('PlanIndexRedirect: Redirecting after hydration to', path, { hasDebts });
  navigate(path, { replace: true });
 }, [hasDebts, hydrationStatus, navigate]);

 // Loading indicator while redirecting
 return (
  <div className="p-6 text-gray-500 flex items-center justify-center">
   <div className="text-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p>Loading your plan...</p>
   </div>
  </div>
 );
}