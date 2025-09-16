/**
 * Demo Mode Provider
 * Manages demo mode state and provides isolation from real user data
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Demo seed profiles - loaded statically for zero runtime cost
const DEMO_SEEDS = {
  default: null, // Loaded on demand
  family: null,
  trap: null
};

// Load seed data on demand
const loadSeed = async (profile) => {
  if (DEMO_SEEDS[profile]) return DEMO_SEEDS[profile];
  
  try {
    const response = await fetch(`/demo/${profile}.json`);
    if (!response.ok) throw new Error(`Failed to load ${profile} seed`);
    const seed = await response.json();
    DEMO_SEEDS[profile] = seed;
    return seed;
  } catch (error) {
    console.warn(`Failed to load demo seed ${profile}:`, error);
    // Fallback to default if it's not already being loaded
    if (profile !== 'default') {
      return loadSeed('default');
    }
    return null;
  }
};

// Get current demo metadata
export const getDemoMeta = () => ({
  demo_mode: sessionStorage.getItem('DEMO_IS_ACTIVE') === '1',
  demo_profile: sessionStorage.getItem('DEMO_PROFILE') || 'default',
  demo_entry: sessionStorage.getItem('DEMO_ENTRY') || 'unknown'
});

const DemoModeContext = createContext({
  isDemo: false,
  enterDemo: () => {},
  exitDemo: () => {},
  demoSource: null,
  getDemoMeta: () => ({})
});

export function DemoModeProvider({ children }) {
  const navigate = useNavigate();
  
  // Initialize from sessionStorage - more reliable format
  const [isDemo, setIsDemo] = useState(() => {
    return sessionStorage.getItem('DEMO_IS_ACTIVE') === '1';
  });
  
  const [demoSource, setDemoSource] = useState(null);
  
  // Sync with sessionStorage
  useEffect(() => {
    if (isDemo) {
      sessionStorage.setItem('DEMO_IS_ACTIVE', '1');
    } else {
      // Clear all demo data from sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('DEMO_') || key === 'SNOWBALL_DEMO_MODE') {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, [isDemo]);
  
  const enterDemo = async (entry = 'unknown', profile = 'default') => {
    setDemoSource(entry);
    setIsDemo(true);
    
    // Load seed data
    const seed = await loadSeed(profile);
    if (seed) {
      // Store demo metadata
      sessionStorage.setItem('DEMO_IS_ACTIVE', '1');
      sessionStorage.setItem('DEMO_PROFILE', profile);
      sessionStorage.setItem('DEMO_ENTRY', entry);
      
      // Store seed data
      if (seed.debts) {
        sessionStorage.setItem('DEMO_DEBTS', JSON.stringify(seed.debts));
      }
      if (seed.settings) {
        sessionStorage.setItem('DEMO_SETTINGS', JSON.stringify(seed.settings));
      }
      if (seed.user) {
        sessionStorage.setItem('DEMO_USER', JSON.stringify(seed.user));
      }
    }
    
    // Track demo session start with enhanced metadata
    if (window.posthog) {
      window.posthog.capture('demo_session_started', {
        demo_mode: true,
        demo_entry: entry,
        demo_profile: profile,
        entry_url: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
      
      // Set person property to exclude from revenue funnels
      window.posthog.people?.set({ is_demo_user: true });
    }
  };
  
  const exitDemo = (destination = '/plan/debts') => {
    // Track analytics BEFORE clearing state
    if (window.posthog) {
      window.posthog.capture('demo_exit', {
        destination,
        source: demoSource,
        timestamp: new Date().toISOString(),
        demo_mode: true
      });
    }
    
    // Clear all demo data thoroughly
    setIsDemo(false);
    setDemoSource(null);
    
    // Force clear all DEMO_ keys from sessionStorage
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('DEMO_') || key === 'SNOWBALL_DEMO_MODE')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Navigate to destination
    navigate(destination);
  };
  
  return (
    <DemoModeContext.Provider value={{
      isDemo,
      enterDemo,
      exitDemo,
      demoSource,
      getDemoMeta
    }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};