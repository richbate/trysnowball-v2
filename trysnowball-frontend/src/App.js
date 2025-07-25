import React, { useState, useRef, useEffect } from 'react';
import Login from './pages/Login';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { UserFlowProvider } from './contexts/UserFlowContext';
import ThemeToggle from './components/ThemeToggle';
import DebtTracker from './pages/MyDebtsPage';
//import Auth, { useAuth } from './components/auth';
import WhatIfMachine from './pages/WhatIfMachine';
import Home from './pages/Home';
import Library from './pages/Library';
import BabySteps from './pages/BabySteps';
import AICoach from './pages/AICoach';
import FuturePlans from './pages/FuturePlans';
import MoneyMakeover from './pages/MoneyMakeover';
import ProgressPage from './pages/ProgressPage';
import MyPlan from './pages/MyPlan';
import Profile from './pages/Profile';
import Article from './pages/Article';

import { UserProvider, useUser } from './contexts/UserContext';


// const user = true;
const loading = false;

// Dropdown Component
function Dropdown({ title, items, isOpen, setIsOpen, colors }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
      >
        <span>{title}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-56 ${colors.surface} ${colors.border} border rounded-lg shadow-lg z-50`}>
          <div className="py-1">
            {items.map(([path, label, description]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 text-sm transition-colors hover:${colors.surfaceSecondary} ${colors.text.primary}`}
              >
                <div className="font-medium">{label}</div>
                {description && <div className={`text-xs ${colors.text.muted} mt-1`}>{description}</div>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const location = useLocation();
  const { colors } = useTheme();
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  // Core Navigation - always visible
  const coreNavItems = [
    ['/', 'Home'],
    ['/my-plan', 'My Plan'],
    ['/ai-coach', 'AI Coach'],
  ];

  // Tools & Support dropdown
  const toolsItems = [
    ['/money-makeover', 'Quick Win Plan', 'Get wins in your first month'],
    ['/baby-steps', 'Debt Foundations', 'Build your foundation step by step'],
    ['/progress', 'Advanced Tracking', 'Detailed progress analytics & reports'],
    ['/future-plans', 'Future Plans', 'Long-term goals & projections'],
  ];

  // Resources dropdown
  const resourcesItems = [
    ['/library', 'Library', 'Articles, guides & help resources'],
  ];

  // Account dropdown
  const accountItems = [
    ['/profile', 'My Profile', 'Name, coach & preferences'],
    ['/workbook', 'Workbook Upload', 'Sync your progress'],
    ['/settings', 'Settings', 'App preferences'],
    ['/logout', 'Log Out', 'Sign out of your account'],
  ];

  return (
    <div className={`min-h-screen ${colors.background}`}>
      {/* Enhanced Navigation */}
      <nav className={`${colors.surface} shadow-sm ${colors.border} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link 
              to="/"
              className="flex items-center space-x-3 transition-colors"
            >
              <img 
                src="/logo-transparent.png" 
                alt="Try Snowball logo" 
                className="h-10 w-auto"
              />
              <span className={`text-sm ${colors.text.muted} font-normal`}>Debt Freedom Tool</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {/* Core Navigation */}
              {coreNavItems.map(([path, label]) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === path
                      ? 'bg-primary text-white shadow-sm transform scale-105'
                      : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                  }`}
                >
                  {label}
                </Link>
              ))}
              
              {/* Divider */}
              <div className={`w-px h-6 mx-2 ${colors.border}`}></div>
              
              {/* Dropdown Menus */}
              <Dropdown
                title="🛠️ Tools"
                items={toolsItems}
                isOpen={toolsOpen}
                setIsOpen={setToolsOpen}
                colors={colors}
              />
              <Dropdown
                title="📚 Resources"
                items={resourcesItems}
                isOpen={resourcesOpen}
                setIsOpen={setResourcesOpen}
                colors={colors}
              />
              {user ? (
                <Dropdown
                  title="⚙️ Account"
                  items={accountItems}
                  isOpen={accountOpen}
                  setIsOpen={setAccountOpen}
                  colors={colors}
                />
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
              )}
              
              <ThemeToggle />
            </div>

            {/* Mobile menu button & theme toggle */}
            <div className="lg:hidden flex items-center space-x-2">
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
            <div className={`lg:hidden ${colors.border} border-t py-2`}>
              <div className="flex flex-col space-y-1">
                {/* Core Navigation */}
                {coreNavItems.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => {
                      setIsMenuOpen(false);
                    }}
                    className={`px-4 py-2 text-left rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === path
                        ? 'bg-primary text-white'
                        : `${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                
                {/* Divider */}
                <div className={`my-2 border-t ${colors.border}`}></div>
                
                {/* Tools Section */}
                <div className={`px-4 py-1 text-xs font-semibold ${colors.text.muted} uppercase tracking-wider`}>
                  🛠️ Tools & Support
                </div>
                {toolsItems.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 pl-8 text-left rounded-lg text-sm font-medium transition-colors ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
                  >
                    {label}
                  </Link>
                ))}
                
                {/* Resources Section */}
                <div className={`px-4 py-1 text-xs font-semibold ${colors.text.muted} uppercase tracking-wider mt-2`}>
                  📚 Resources
                </div>
                {resourcesItems.map(([path, label]) => (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 pl-8 text-left rounded-lg text-sm font-medium transition-colors ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
                  >
                    {label}
                  </Link>
                ))}
                
                {/* Account Section */}
                {user ? (
                  <>
                    <div className={`px-4 py-1 text-xs font-semibold ${colors.text.muted} uppercase tracking-wider mt-2`}>
                      ⚙️ Account & Settings
                    </div>
                    {accountItems.map(([path, label]) => (
                      <Link
                        key={path}
                        to={path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`px-4 py-2 pl-8 text-left rounded-lg text-sm font-medium transition-colors ${colors.text.secondary} hover:${colors.text.primary} hover:${colors.surfaceSecondary}`}
                      >
                        {label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="mx-4 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <div className={`transition-all duration-300 ease-in-out ${colors.background} min-h-screen`}>
        <Routes>
  {/* Core Navigation Routes */}
  <Route path="/" element={<Home />} />
  <Route path="/my-plan" element={<MyPlan />} />
  <Route path="/ai-coach" element={<AICoach />} />
  
  {/* Tools & Support Routes */}
  <Route path="/money-makeover" element={<MoneyMakeover />} />
  <Route path="/baby-steps" element={<BabySteps />} />
  <Route path="/progress" element={<ProgressPage />} />
  <Route path="/future-plans" element={<FuturePlans />} />
  
  {/* Resources Routes */}
  <Route path="/library" element={<Library />} />
  <Route path="/article/:slug" element={<Article />} />
  
  {/* Legacy Routes - for backwards compatibility */}
  <Route path="/what-if" element={<WhatIfMachine />} />
  <Route path="/debts" element={<DebtTracker />} />
  
  {/* ✅ NEW: Login Route */}
  <Route path="/login" element={<Login />} />
  
  {/* Account Routes - placeholder components for now */}
  <Route path="/profile" element={<Profile />} />
  <Route path="/workbook" element={<div className="p-6"><h1 className="text-2xl font-bold">Workbook Upload (Coming Soon)</h1></div>} />
  <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings (Coming Soon)</h1></div>} />
  <Route path="/logout" element={<div className="p-6"><h1 className="text-2xl font-bold">Log Out (Coming Soon)</h1></div>} />
</Routes>
      </div>

      {/* Footer */}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <UserFlowProvider>
        <UserProvider>
          <Router>
            <Navigation />
          </Router>
        </UserProvider>
      </UserFlowProvider>
    </ThemeProvider>
  );
}

export default App;