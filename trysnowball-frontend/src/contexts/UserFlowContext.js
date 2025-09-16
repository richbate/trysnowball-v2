import React, { createContext, useContext, useState } from 'react';

const UserFlowContext = createContext();

export const useUserFlow = () => {
  const context = useContext(UserFlowContext);
  if (!context) {
    throw new Error('useUserFlow must be used within a UserFlowProvider');
  }
  return context;
};

export const UserFlowProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(() => {
    // Check if user has chosen demo mode
    return localStorage.getItem('trysnowball-demo') === 'true';
  });
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [demoInteractions, setDemoInteractions] = useState(() => {
    // Track demo interactions for email prompts
    const saved = localStorage.getItem('trysnowball-demo-interactions');
    return saved ? JSON.parse(saved) : 0;
  });

  const startDemo = () => {
    setIsDemo(true);
    localStorage.setItem('trysnowball-demo', 'true');
    setDemoInteractions(0);
    localStorage.setItem('trysnowball-demo-interactions', '0');
  };

  const trackDemoInteraction = () => {
    if (isDemo) {
      const newCount = demoInteractions + 1;
      setDemoInteractions(newCount);
      localStorage.setItem('trysnowball-demo-interactions', newCount.toString());
      
      // Show email prompt after 3 interactions
      if (newCount >= 3 && !showEmailPrompt) {
        setShowEmailPrompt(true);
      }
    }
  };

  const dismissEmailPrompt = () => {
    setShowEmailPrompt(false);
  };

  const value = {
    isDemo,
    showEmailPrompt,
    demoInteractions,
    startDemo,
    trackDemoInteraction,
    dismissEmailPrompt,
  };

  return (
    <UserFlowContext.Provider value={value}>
      {children}
    </UserFlowContext.Provider>
  );
};