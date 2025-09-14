import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

/**
 * Hook to manage trial status and countdown
 * Returns trial state, days remaining, and helper functions
 */
export const useTrialStatus = () => {
 const { user, isPro } = useAuth();
 const [currentTime, setCurrentTime] = useState(Date.now());

 // Update current time every minute to keep countdown fresh
 useEffect(() => {
  const interval = setInterval(() => {
   setCurrentTime(Date.now());
  }, 60000); // Update every minute

  return () => clearInterval(interval);
 }, []);

 const trialStatus = useMemo(() => {
  // Default state
  const defaultStatus = {
   isTrialing: false,
   hasTrialed: false,
   isExpired: false,
   daysLeft: 0,
   hoursLeft: 0,
   trialEndDate: null,
   trialStarted: false,
   showWarning: false, // Show warning 2 days before expiry
   showUrgent: false, // Show urgent warning 1 day before expiry
  };

  if (!user) return defaultStatus;

  // Check if user has trial data
  const hasUsedTrial = user.hasUsedTrial;
  const trialEndsAt = user.trialEndsAt;
  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : null;
  
  if (!hasUsedTrial || !trialEndDate) {
   return {
    ...defaultStatus,
    hasTrialed: hasUsedTrial,
   };
  }

  // Calculate time remaining
  const timeLeft = trialEndDate.getTime() - currentTime;
  const daysLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60 * 60)));
  
  const isExpired = timeLeft <= 0;
  const isTrialing = !isExpired && isPro && hasUsedTrial;
  const showWarning = daysLeft <= 2 && daysLeft > 1 && isTrialing;
  const showUrgent = daysLeft <= 1 && !isExpired && isTrialing;

  return {
   isTrialing,
   hasTrialed: hasUsedTrial,
   isExpired,
   daysLeft,
   hoursLeft,
   trialEndDate,
   trialStarted: hasUsedTrial,
   showWarning,
   showUrgent,
  };
 }, [user, isPro, currentTime]);

 // Helper functions
 const getTrialStatusText = () => {
  if (!trialStatus.trialStarted) return null;
  
  if (trialStatus.isExpired) {
   return 'Trial Ended';
  }
  
  if (trialStatus.isTrialing) {
   if (trialStatus.daysLeft === 0) {
    return `Trial ends in ${trialStatus.hoursLeft}h`;
   } else if (trialStatus.daysLeft === 1) {
    return 'Trial ends tomorrow';
   } else {
    return `Trial - ${trialStatus.daysLeft} days left`;
   }
  }
  
  return null;
 };

 const getTrialBadgeColor = () => {
  if (trialStatus.showUrgent) return 'red';
  if (trialStatus.showWarning) return 'yellow';
  if (trialStatus.isTrialing) return 'blue';
  return 'gray';
 };

 const formatTrialEndDate = () => {
  if (!trialStatus.trialEndDate) return null;
  
  return new Intl.DateTimeFormat('en-GB', {
   weekday: 'long',
   day: 'numeric',
   month: 'long',
   hour: '2-digit',
   minute: '2-digit',
  }).format(trialStatus.trialEndDate);
 };

 return {
  ...trialStatus,
  getTrialStatusText,
  getTrialBadgeColor,
  formatTrialEndDate,
 };
};