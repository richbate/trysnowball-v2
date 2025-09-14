import { useRef } from 'react';
import { useExperiment } from './useExperiment';

export function useDebtConversionTracker() {
 const firedRef = useRef(false);
 const exp = useExperiment('home_page_entry', {
  defaultVariant: 'landing',
  allowed: ['landing', 'dashboard', 'hybrid']
 });

 const markDebtAdded = (debtCountAfter: number) => {
  if (firedRef.current) return;
  if (debtCountAfter === 1) { // first-ever debt
   exp.convert('debt_added', { count: 1 });
   firedRef.current = true;
  }
 };

 // Additional conversion helpers
 const markSignupCompleted = () => {
  exp.convert('signup_completed');
 };

 const markDemoActivated = () => {
  exp.convert('demo_activated');
 };

 const markReturnedD7 = () => {
  exp.convert('returned_d7');
 };

 return { 
  markDebtAdded, 
  markSignupCompleted, 
  markDemoActivated, 
  markReturnedD7 
 };
}