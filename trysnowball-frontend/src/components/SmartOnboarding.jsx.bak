import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ONBOARDING_QUESTIONS, getNextStep, saveOnboardingProfile } from '../data/onboardingConfig';

export const SmartOnboarding = ({ onComplete }) => {
 const navigate = useNavigate();
 const [currentStep, setCurrentStep] = useState(0);
 const [answers, setAnswers] = useState({});
 
 const questions = Object.values(ONBOARDING_QUESTIONS);
 const totalSteps = questions.length;
 const isLastStep = currentStep === totalSteps - 1;
 const currentQuestion = questions[currentStep];

 const handleAnswer = (questionId, answerId) => {
  const newAnswers = { ...answers, [questionId]: answerId };
  setAnswers(newAnswers);
  
  // Track step completion
  if (window.posthog) {
   window.posthog.capture(`onboarding_step_${currentStep + 1}`, {
    question: questionId,
    answer: answerId
   });
  }

  if (isLastStep) {
   // Complete onboarding
   const profile = {
    motivation: newAnswers.motivation,
    situation: newAnswers.situation
   };
   
   saveOnboardingProfile(profile);
   
   // Get personalized next step
   const nextStep = getNextStep(profile.motivation, profile.situation);
   
   if (onComplete) {
    onComplete(profile, nextStep);
   } else {
    // Navigate to recommended next step
    navigate(nextStep.route);
   }
  } else {
   // Go to next question
   setCurrentStep(currentStep + 1);
  }
 };

 const handleBack = () => {
  if (currentStep > 0) {
   setCurrentStep(currentStep - 1);
  }
 };

 const handleSkip = () => {
  // Skip to default experience
  navigate('/plan/debts');
 };

 if (!currentQuestion) return null;

 return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
   <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
    {/* Progress bar */}
    <div className="mb-8">
     <div className="flex justify-between text-sm text-gray-500 mb-2">
      <span>Question {currentStep + 1} of {totalSteps}</span>
      <button 
       onClick={handleSkip}
       className="text-blue-600 hover:text-blue-700 underline"
      >
       Skip for now
      </button>
     </div>
     <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
       className="bg-blue-600 h-2 rounded-full transition-all duration-300"
       style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
      />
     </div>
    </div>

    {/* Question */}
    <div className="text-center mb-8">
     <h1 className="text-3xl font-bold text-gray-900 mb-4">
      {currentQuestion.title}
     </h1>
     <p className="text-lg text-gray-600">
      {currentQuestion.subtitle}
     </p>
    </div>

    {/* Answer options */}
    <div className="space-y-4 mb-8">
     {currentQuestion.options.map((option) => (
      <button
       key={option.id}
       onClick={() => handleAnswer(currentQuestion.id, option.id)}
       className="w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
      >
       <div className="flex items-start">
        <span className="text-2xl mr-4 group-hover:scale-110 transition-transform">
         {option.icon}
        </span>
        <div>
         <h3 className="font-semibold text-gray-900 mb-1">
          {option.label}
         </h3>
         <p className="text-gray-600 text-sm">
          {option.description}
         </p>
        </div>
       </div>
      </button>
     ))}
    </div>

    {/* Navigation */}
    <div className="flex justify-between items-center">
     <button
      onClick={handleBack}
      disabled={currentStep === 0}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
       currentStep === 0 
        ? 'text-gray-400 cursor-not-allowed' 
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
      }`}
     >
      <ChevronLeft className="w-4 h-4 mr-1" />
      Back
     </button>

     <div className="text-sm text-gray-500">
      Your answers help us personalize TrySnowball for you
     </div>

     <div className="w-20" /> {/* Spacer for symmetry */}
    </div>
   </div>
  </div>
 );
};

export default SmartOnboarding;