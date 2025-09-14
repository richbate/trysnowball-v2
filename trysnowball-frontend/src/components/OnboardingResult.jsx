import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { getNextStep } from '../data/onboardingConfig';

export const OnboardingResult = ({ profile, onContinue }) => {
 const navigate = useNavigate();
 const nextStep = getNextStep(profile.motivation, profile.situation);

 const handleContinue = () => {
  if (onContinue) {
   onContinue();
  } else {
   navigate(nextStep.route);
  }
 };

 // Motivation labels for display
 const motivationLabels = {
  fast: 'Get debt-free fast',
  interest: 'Save on interest',
  motivation: 'Stay motivated',
  independence: 'Financial independence',
  plan: 'Clear structure',
  understanding: 'Learn and understand'
 };

 const situationLabels = {
  simple: 'Few credit cards',
  mixed: 'Multiple debts',
  overwhelmed: 'Struggling to keep up',
  unknown: 'Still figuring it out'
 };

 return (
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
   <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
    {/* Success indicator */}
    <div className="text-center mb-8">
     <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
      <Check className="w-8 h-8 text-green-600" />
     </div>
     <h1 className="text-3xl font-bold text-gray-900 mb-2">
      Perfect! Here's your personalized plan
     </h1>
     <p className="text-lg text-gray-600">
      Based on your goal and situation, we've got the perfect starting point
     </p>
    </div>

    {/* Profile summary */}
    <div className="bg-gray-50 rounded-xl p-6 mb-8">
     <h3 className="font-semibold text-gray-900 mb-4">Your Profile:</h3>
     <div className="grid md:grid-cols-2 gap-4">
      <div>
       <span className="text-sm text-gray-500">Your Goal</span>
       <p className="font-medium text-gray-900">
        {motivationLabels[profile.motivation] || profile.motivation}
       </p>
      </div>
      <div>
       <span className="text-sm text-gray-500">Your Situation</span>
       <p className="font-medium text-gray-900">
        {situationLabels[profile.situation] || profile.situation}
       </p>
      </div>
     </div>
    </div>

    {/* Recommendation */}
    <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6 mb-8">
     <h2 className="text-2xl font-bold text-blue-900 mb-3">
      {nextStep.title}
     </h2>
     <p className="text-blue-800 mb-6 text-lg">
      {nextStep.description}
     </p>
     
     <button
      onClick={handleContinue}
      className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
     >
      {nextStep.cta}
      <ArrowRight className="w-5 h-5 ml-2" />
     </button>
    </div>

    {/* Alternative options */}
    <div className="text-center">
     <p className="text-sm text-gray-500 mb-4">
      Not quite right? You can always explore other options later.
     </p>
     <div className="flex justify-center space-x-4">
      <button
       onClick={() => navigate('/plan/debts')}
       className="text-blue-600 hover:text-blue-700 underline text-sm"
      >
       View all debts
      </button>
      <button
       onClick={() => navigate('/library')}
       className="text-blue-600 hover:text-blue-700 underline text-sm"
      >
       Browse guides
      </button>
      <button
       onClick={() => navigate('/plan/strategy')}
       className="text-blue-600 hover:text-blue-700 underline text-sm"
      >
       Compare strategies
      </button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default OnboardingResult;