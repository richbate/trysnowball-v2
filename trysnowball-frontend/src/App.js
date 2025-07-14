import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import DebtTracker from './pages/MyDebtsPage';
//import Auth, { useAuth } from './components/auth';
import WhatIfMachine from './pages/WhatIfMachine';
import Home from './pages/Home';
import Library from './pages/Library';
import SpendAnalyser from './components/SpendAnalyser';

// const user = true;
const loading = false;

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { colors } = useTheme();

  // const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // if (!user) {
  //  return <Auth onAuthSuccess={() => {}} />;
  //}

  // Navigation items with emojis for better UX - ordered by logical user flow
  const navItems = [
    ['/', '🏠 Home'],
    ['/debts', '🎯 My Debts'],
    ['/analyser', '🔍 Spend Analyser'],
    ['/what-if', '🚀 What If Machine'],
    ['/library', '📚 Library'],
  ];

  return (
    <div className={`min-h-screen ${colors.background}`}>
      {/* Enhanced Navigation */}
      <nav className={`${colors.surface} shadow-sm ${colors.border} border-b sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link 
              to="/"
              className={`flex items-center space-x-2 text-2xl font-bold ${colors.brand.text} transition-colors`}
            >
              <span>TrySnowball</span>
              <span className={`text-sm ${colors.text.muted} font-normal`}>Debt Freedom Tool</span>
            </Link>

            {/* Navigation Items & Theme Toggle */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map(([path, label]) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-blue-600 text-white shadow-sm transform scale-105'
                      : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                  }`}
                >
                  {label}
                </Link>
              ))}
              <ThemeToggle />
            </div>

            {/* Mobile menu button & theme toggle */}
            <div className="md:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`${colors.text.secondary} hover:${colors.text.primary} p-2`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className={`md:hidden ${colors.border} border-t py-2`}>
              <div className="flex flex-col space-y-1">
                {navItems.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => {
                      setIsMenuOpen(false); // Close menu when clicked
                    }}
                    className={`px-4 py-2 text-left rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === path
                        ? 'bg-blue-600 text-white'
                        : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <div className={`transition-all duration-300 ease-in-out ${colors.background} min-h-screen`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyser" element={<SpendAnalyser />} />
          <Route path="/what-if" element={<WhatIfMachine />} />
          <Route path="/debts" element={<DebtTracker />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer className={`${colors.surface} ${colors.border} border-t mt-16`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`text-center ${colors.text.muted} text-sm`}>
            <p>🔒 All your financial data stays private on your device</p>
            <p className="mt-2">Built to help you become debt-free faster with the snowball method</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navigation />
      </Router>
    </ThemeProvider>
  );
}

export default App;