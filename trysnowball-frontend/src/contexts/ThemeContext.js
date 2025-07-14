import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem('trysnowball-theme');
    if (saved) {
      return saved === 'dark';
    }
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference
    localStorage.setItem('trysnowball-theme', isDarkMode ? 'dark' : 'light');
    
    // Update document class for Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
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