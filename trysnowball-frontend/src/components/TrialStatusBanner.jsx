import React, { useEffect } from 'react';
import { Crown, Clock, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrialStatus } from '../hooks/useTrialStatus';
import { analytics } from '../lib/posthog';
import { useAuth } from '../contexts/AuthContext.tsx';

const TrialStatusBanner = ({ onDismiss, isDismissed = false }) => {
 const { user } = useAuth();
 const navigate = useNavigate();
 const {
  isTrialing,
  isExpired,
  showWarning,
  showUrgent,
  daysLeft,
  hoursLeft,
  getTrialStatusText,
  formatTrialEndDate
 } = useTrialStatus();

 // Track banner view when it becomes visible
 useEffect(() => {
  if (user && !isDismissed && (isTrialing || isExpired)) {
   analytics.track('trial_banner_viewed', {
    trial_status: isExpired ? 'expired' : 'active',
    days_left: daysLeft,
    hours_left: hoursLeft,
    user_id: user.id,
    banner_type: isExpired ? 'expired' : (showUrgent ? 'urgent' : (showWarning ? 'warning' : 'info'))
   });
  }
 }, [user, isDismissed, isTrialing, isExpired, daysLeft, hoursLeft, showUrgent, showWarning]);

 // Don't show banner if not relevant or dismissed
 if (!user || isDismissed || (!isTrialing && !isExpired)) {
  return null;
 }

 const handleUpgradeClick = () => {
  analytics.track('trial_banner_upgrade_clicked', {
   trial_status: isExpired ? 'expired' : 'active',
   days_left: daysLeft,
   hours_left: hoursLeft,
   user_id: user.id,
   banner_type: isExpired ? 'expired' : (showUrgent ? 'urgent' : (showWarning ? 'warning' : 'info'))
  });
  
  navigate('/upgrade');
 };

 const handleDismiss = () => {
  if (onDismiss) {
   analytics.track('trial_banner_dismissed', {
    trial_status: isExpired ? 'expired' : 'active',
    days_left: daysLeft,
    user_id: user.id
   });
   onDismiss();
  }
 };

 // Different styles based on urgency
 const getBannerStyles = () => {
  if (isExpired) {
   return {
    bg: 'bg-red-50 border-red-200 ',
    text: 'text-red-800 ',
    icon: 'text-red-600 ',
    button: 'bg-red-600 hover:bg-red-700 text-white'
   };
  }
  
  if (showUrgent) {
   return {
    bg: 'bg-orange-50 border-orange-200 ',
    text: 'text-orange-800 ',
    icon: 'text-orange-600 ',
    button: 'bg-orange-600 hover:bg-orange-700 text-white'
   };
  }
  
  if (showWarning) {
   return {
    bg: 'bg-yellow-50 border-yellow-200 ',
    text: 'text-yellow-800 ',
    icon: 'text-yellow-600 ',
    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
   };
  }
  
  // Default active trial
  return {
   bg: 'bg-blue-50 border-blue-200 ',
   text: 'text-blue-800 ',
   icon: 'text-blue-600 ',
   button: 'bg-blue-600 hover:bg-blue-700 text-white'
  };
 };

 const styles = getBannerStyles();
 const statusText = getTrialStatusText();

 const getIcon = () => {
  if (isExpired) return <X className={`w-5 h-5 ${styles.icon}`} />;
  if (showUrgent) return <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />;
  if (showWarning) return <Clock className={`w-5 h-5 ${styles.icon}`} />;
  return <Crown className={`w-5 h-5 ${styles.icon}`} />;
 };

 const getMessage = () => {
  if (isExpired) {
   return {
    main: 'Your Pro trial has ended',
    sub: 'Upgrade to continue accessing Pro features and keep your progress going.'
   };
  }
  
  if (showUrgent) {
   return {
    main: `⚡ Trial ends ${daysLeft === 0 ? `in ${hoursLeft} hours` : 'tomorrow'}!`,
    sub: 'Upgrade now to keep unlimited access to Pro features.'
   };
  }
  
  if (showWarning) {
   return {
    main: `⏰ ${statusText}`,
    sub: 'Don\'t lose access to your Pro features. Upgrade to continue your debt-free journey.'
   };
  }
  
  return {
   main: `🎉 ${statusText}`,
   sub: `Ends ${formatTrialEndDate()}. Upgrade anytime to continue after your trial.`
  };
 };

 const { main, sub } = getMessage();

 return (
  <div 
   data-testid="trial-banner"
   className={`border-l-4 ${styles.bg} p-4 mb-6 rounded-r-lg border-l-current`}
  >
   <div className="flex items-start justify-between">
    <div className="flex items-start space-x-3">
     <span data-testid="trial-icon">{getIcon()}</span>
     <div className="flex-1">
      <p className={`font-semibold ${styles.text} text-sm`}>
       {main}
      </p>
      <p className={`text-xs ${styles.text} opacity-80 mt-1`}>
       {sub}
      </p>
     </div>
    </div>
    
    <div className="flex items-center space-x-2 ml-4">
     <button
      data-testid="trial-upgrade-btn"
      onClick={handleUpgradeClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${styles.button}`}
     >
      {isExpired ? 'Upgrade Now' : 'Keep Pro'}
     </button>
     
     {onDismiss && !isExpired && (
      <button
       data-testid="trial-dismiss-btn"
       onClick={handleDismiss}
       className={`p-1 rounded-md hover:bg-black/10 transition-colors ${styles.text}`}
       aria-label="Dismiss banner"
      >
       <X className="w-4 h-4" />
      </button>
     )}
    </div>
   </div>
  </div>
 );
};

export default TrialStatusBanner;