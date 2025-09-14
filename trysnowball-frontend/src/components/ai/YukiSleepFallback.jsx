import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../../hooks/useAnalytics';
import Button from '../ui/Button';

const YukiSleepFallback = () => {
 const navigate = useNavigate();
 const { trackEvent } = useAnalytics();

 // Track that sleep mode fallback was shown (once per component mount)
 useEffect(() => {
  trackEvent('ai_sleep_mode_shown', {
   timestamp: new Date().toISOString(),
   source: 'coach_page'
  });
 }, []); // Only run once when component mounts

 const handleGoToDebts = () => {
  trackEvent('ai_sleep_cta_clicked', {
   destination: 'debts',
   timestamp: new Date().toISOString()
  });
  navigate('/debts');
 };

 return (
  <div className="max-w-md mx-auto mt-8 p-6 bg-surface rounded-lg shadow-lg text-center">
   {/* Sleeping cat SVG - soft, Yuki-style */}
   <div className="mb-6">
    <svg 
     viewBox="0 0 120 80" 
     className="w-24 h-16 mx-auto text-muted"
     fill="currentColor"
    >
     {/* Cat body */}
     <ellipse cx="60" cy="50" rx="35" ry="20" className="opacity-80"/>
     
     {/* Cat head */}
     <circle cx="60" cy="35" r="18" className="opacity-80"/>
     
     {/* Ears */}
     <path d="M45 25 L42 18 L50 22 Z" className="opacity-70"/>
     <path d="M75 25 L78 18 L70 22 Z" className="opacity-70"/>
     
     {/* Closed sleepy eyes */}
     <path d="M52 32 Q55 30 58 32" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-90"/>
     <path d="M62 32 Q65 30 68 32" stroke="currentColor" strokeWidth="2" fill="none" className="opacity-90"/>
     
     {/* Nose */}
     <circle cx="60" cy="38" r="1.5" className="opacity-60"/>
     
     {/* Tail curled up */}
     <path d="M25 55 Q20 45 25 40 Q30 35 35 40" stroke="currentColor" strokeWidth="3" fill="none" className="opacity-60"/>
     
     {/* Sleeping Z's */}
     <text x="85" y="25" className="text-xs font-bold opacity-60">Z</text>
     <text x="92" y="18" className="text-xs font-bold opacity-40">z</text>
     <text x="98" y="22" className="text-xs font-bold opacity-30">z</text>
    </svg>
   </div>

   {/* Sleep message */}
   <div className="mb-6">
    <h2 className="text-xl font-semibold text-text mb-2">
     Yuki's having a nap 😴
    </h2>
    <p className="text-muted leading-relaxed">
     Our AI coach is offline right now, but you can still track your progress and update your debts.
    </p>
   </div>

   {/* CTA Button */}
   <Button 
    onClick={handleGoToDebts}
    variant="primary"
    className="px-6 py-2"
   >
    Go to My Debts
   </Button>

   {/* Optional subtle hint */}
   <p className="text-xs text-muted mt-4">
    Yuki will be back soon to help with your debt strategy
   </p>
  </div>
 );
};

export default YukiSleepFallback;