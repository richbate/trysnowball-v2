import React from 'react';

interface SettingsContextType {
 analyticsEnabled: boolean;
 setAnalyticsEnabled: (enabled: boolean) => void;
}

const SettingsContext = React.createContext<SettingsContextType>({ 
 analyticsEnabled: false, 
 setAnalyticsEnabled: (_v: boolean) => {} 
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
 const [analyticsEnabled, setAnalyticsEnabled] = React.useState(() => {
  const v = localStorage.getItem('ts:analyticsEnabled');
  return v ? v === 'true' : false;
 });
 
 React.useEffect(() => {
  localStorage.setItem('ts:analyticsEnabled', String(analyticsEnabled));
 }, [analyticsEnabled]);
 
 return (
  <SettingsContext.Provider value={{ analyticsEnabled, setAnalyticsEnabled }}>
   {children}
  </SettingsContext.Provider>
 );
};

export const useSettings = () => React.useContext(SettingsContext);