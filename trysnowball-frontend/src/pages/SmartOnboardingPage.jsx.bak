import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SmartOnboarding } from '../components/SmartOnboarding';
import { OnboardingResult } from '../components/OnboardingResult';
import { needsOnboarding, getOnboardingProfile } from '../data/onboardingConfig';

export const SmartOnboardingPage = () => {
 const navigate = useNavigate();
 const [showResult, setShowResult] = useState(false);
 const [profile, setProfile] = useState(null);

 // If user has already completed onboarding, show their profile
 const existingProfile = getOnboardingProfile();
 const hasProfile = existingProfile.completed_at;

 const handleOnboardingComplete = (userProfile, nextStep) => {
  setProfile(userProfile);
  setShowResult(true);
  
  // Track completion
  if (window.posthog) {
   window.posthog.capture('onboarding_flow_complete', {
    ...userProfile,
    recommended_route: nextStep.route
   });
  }
 };

 const handleResultContinue = () => {
  navigate('/'); // Go back to app with personalized experience
 };

 // If user wants to retake onboarding
 const handleRetakeOnboarding = () => {
  localStorage.removeItem('onboarding_profile');
  window.location.reload();
 };

 // Show existing profile summary if they've already done it
 if (hasProfile && !showResult) {
  return (
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 text-center">
     <h1 className="text-3xl font-bold text-gray-900 mb-6">
      Welcome back! 
     </h1>
     <p className="text-lg text-gray-600 mb-8">
      We've personalized TrySnowball based on your previous answers.
     </p>
     
     <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
      <h3 className="font-semibold text-gray-900 mb-2">Your Profile:</h3>
      <p className="text-gray-700">
       <strong>Goal:</strong> {existingProfile.motivation || 'Not set'}
      </p>
      <p className="text-gray-700">
       <strong>Situation:</strong> {existingProfile.situation || 'Not set'}
      </p>
     </div>

     <div className="flex space-x-4">
      <button
       onClick={() => navigate('/')}
       className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
      >
       Continue to TrySnowball
      </button>
      <button
       onClick={handleRetakeOnboarding}
       className="flex-1 border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
      >
       Update Preferences
      </button>
     </div>
    </div>
   </div>
  );
 }

 // Show result page after completing survey
 if (showResult && profile) {
  return <OnboardingResult profile={profile} onContinue={handleResultContinue} />;
 }

 // Show the onboarding survey
 return <SmartOnboarding onComplete={handleOnboardingComplete} />;
};

export default SmartOnboardingPage;