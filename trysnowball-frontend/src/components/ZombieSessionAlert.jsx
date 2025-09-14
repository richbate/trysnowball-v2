/**
 * Zombie Session Alert
 * Shows when user data exists but authentication token is missing
 * This happens when tokens expire or are cleared but user data remains cached
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ZombieSessionAlert = () => {
 const [isVisible, setIsVisible] = useState(false);
 const navigate = useNavigate();

 useEffect(() => {
  const handleZombieDetected = () => {
   setIsVisible(true);
  };

  window.addEventListener('auth-zombie-detected', handleZombieDetected);
  return () => window.removeEventListener('auth-zombie-detected', handleZombieDetected);
 }, []);

 const handleReLogin = () => {
  // Clear any stale data
  localStorage.clear();
  sessionStorage.clear();
  
  // Navigate to login
  navigate('/auth/login');
  setIsVisible(false);
 };

 const handleDismiss = () => {
  setIsVisible(false);
  // Set a flag to not show again this session
  sessionStorage.setItem('zombie-alert-dismissed', 'true');
 };

 // Don't show if already dismissed this session
 if (sessionStorage.getItem('zombie-alert-dismissed')) {
  return null;
 }

 if (!isVisible) return null;

 return (
  <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] max-w-md w-full px-4">
   <div className="bg-white rounded-lg shadow-xl border border-orange-200 p-4 animate-slideDown">
    <div className="flex items-start gap-3">
     {/* Warning Icon */}
     <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
      <AlertTriangle className="w-5 h-5 text-orange-600" />
     </div>
     
     {/* Content */}
     <div className="flex-1">
      <h3 className="text-lg font-bold text-gray-900 mb-1">
       Authentication Required
      </h3>
      <p className="text-sm text-gray-700 mb-3">
       Your session has expired. Please log in again to save your changes to the cloud.
      </p>
      <div className="flex items-center gap-2">
       <button
        onClick={handleReLogin}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
       >
        <LogIn className="w-4 h-4" />
        Log In Again
       </button>
       <button
        onClick={handleDismiss}
        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
       >
        Continue Offline
       </button>
      </div>
     </div>
     
     {/* Close Button */}
     <button
      onClick={handleDismiss}
      className="text-gray-400 hover:text-gray-600 p-1 rounded flex-shrink-0"
     >
      <X className="w-4 h-4" />
     </button>
    </div>
   </div>
  </div>
 );
};

export default ZombieSessionAlert;