/**
 * Token Expiry Warning Modal
 * Shows users when their session will expire soon and offers refresh
 */

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { refreshToken, getTokenExpiry } from '../utils/tokenStorage';

const TokenExpiryModal = () => {
 const [isVisible, setIsVisible] = useState(false);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [timeToExpiry, setTimeToExpiry] = useState(0);
 const [expiryDate, setExpiryDate] = useState(null);
 
 useEffect(() => {
  const handleTokenExpiryWarning = (event) => {
   const { timeToExpiry: minutes, expiryDate } = event.detail;
   setTimeToExpiry(minutes);
   setExpiryDate(expiryDate);
   setIsVisible(true);
  };
  
  window.addEventListener('token-expiry-warning', handleTokenExpiryWarning);
  return () => window.removeEventListener('token-expiry-warning', handleTokenExpiryWarning);
 }, []);
 
 useEffect(() => {
  const handleTokenRefreshed = () => {
   setIsVisible(false);
   setIsRefreshing(false);
  };
  
  window.addEventListener('token-refreshed', handleTokenRefreshed);
  return () => window.removeEventListener('token-refreshed', handleTokenRefreshed);
 }, []);
 
 const handleRefreshToken = async () => {
  setIsRefreshing(true);
  
  try {
   const success = await refreshToken();
   if (success) {
    setIsVisible(false);
    // Show success message
    if (typeof window !== 'undefined' && window.toast?.success) {
     window.toast.success('Session refreshed successfully!');
    }
   } else {
    if (typeof window !== 'undefined' && window.toast?.error) {
     window.toast.error('Session refresh failed. Please log in again.');
    }
   }
  } catch (error) {
   console.error('Manual token refresh failed:', error);
   if (typeof window !== 'undefined' && window.toast?.error) {
    window.toast.error('Session refresh failed. Please log in again.');
   }
  }
  
  setIsRefreshing(false);
 };
 
 const handleLogout = () => {
  // Clear storage and redirect to login
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = '/auth/login';
 };
 
 const formatTimeRemaining = (minutes) => {
  if (minutes <= 0) return 'Expired';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
   return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours} hours`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
   ? `${days}d ${remainingHours}h`
   : `${days} days`;
 };
 
 if (!isVisible) return null;
 
 return (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
   <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-slideIn">
    {/* Header */}
    <div className="flex items-center gap-3 mb-4">
     <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
      <Clock className="w-6 h-6 text-amber-600" />
     </div>
     <div>
      <h2 className="text-xl font-bold text-gray-900">
       Session Expiring Soon
      </h2>
      <p className="text-sm text-gray-600">
       Your login will expire in {formatTimeRemaining(timeToExpiry)}
      </p>
     </div>
    </div>
    
    {/* Content */}
    <div className="mb-6">
     <p className="text-gray-700 mb-3">
      To continue using TrySnowball without interruption, please refresh your session or log in again.
     </p>
     {expiryDate && (
      <p className="text-sm text-gray-500">
       Current session expires: {expiryDate.toLocaleString()}
      </p>
     )}
    </div>
    
    {/* Actions */}
    <div className="flex flex-col gap-3">
     <button
      onClick={handleRefreshToken}
      disabled={isRefreshing}
      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
     >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
     </button>
     
     <div className="flex gap-2">
      <button
       onClick={() => setIsVisible(false)}
       className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
      >
       Remind Later
      </button>
      
      <button
       onClick={handleLogout}
       className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm"
      >
       <LogOut className="w-4 h-4" />
       Log Out
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default TokenExpiryModal;