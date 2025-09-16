import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { settings, update: updateSettings, loading } = useSettings();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Default to system preference while settings load
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update theme when settings load or change
  useEffect(() => {
    if (loading) return; // defer until settings loaded
    
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'dark');
    
    const mode = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    
    // Apply both class patterns for compatibility
    root.classList.add(`theme-${mode}`);
    if (mode === 'dark') {
      root.classList.add('dark'); // Tailwind compatibility
    }
    
    setIsDarkMode(mode === 'dark');
  }, [loading, settings.theme]);

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode); // Optimistic update
    await updateSettings({ theme: newTheme });
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    // Theme-aware color schemes
    colors: {
      background: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
      surface: isDarkMode ? 'bg-gray-800' : 'bg-white',
      surfaceSecondary: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
      text: {
        primary: isDarkMode ? 'text-white' : 'text-gray-900',
        secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
        muted: isDarkMode ? 'text-gray-400' : 'text-gray-500'
      },
      border: isDarkMode ? 'border-gray-600' : 'border-gray-200',
      borderLight: isDarkMode ? 'border-gray-700' : 'border-gray-100',
      brand: {
        primary: 'bg-blue-600 hover:bg-blue-700',
        text: 'text-blue-600 hover:text-blue-700'
      },
      success: isDarkMode ? 'bg-green-600' : 'bg-green-600',
      warning: isDarkMode ? 'bg-yellow-600' : 'bg-yellow-600',
      danger: isDarkMode ? 'bg-red-600' : 'bg-red-600'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};