import React, { useState } from 'react';
import './App.css';

// Import your components
import LibraryIndex from './components/LibraryIndex';
import SpendingHabitsArticle from './components/SpendingHabitsArticle';
import WhatIfMachine from './components/WhatIfMachine';

// Navigation Component
const Navigation = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'debts', label: 'Debts' },
    { id: 'snowball', label: 'Snowball' },
    { id: 'what-if', label: 'What If' },
    { id: 'library', label: 'Library' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => onPageChange('home')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              Snowball
            </button>
          </div>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

// Home Page Component (your existing homepage)
const HomePage = ({ onPageChange }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Get Out of Debt
            <span className="text-blue-600"> Faster</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            See exactly when you'll be debt-free and how much you'll save with smarter payment strategies.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button
                onClick={() => onPageChange('what-if')}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Try the What If Machine
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button
                onClick={() => onPageChange('library')}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smart Scenarios
              </h3>
              <p className="text-gray-600">
                See exactly how small changes can save you thousands and years of payments.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Debt Snowball
              </h3>
              <p className="text-gray-600">
                Build momentum by paying off your smallest debts first for psychological wins.
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Action Plans
              </h3>
              <p className="text-gray-600">
                Get specific strategies for finding extra money and staying motivated.
              </p>
            </div>
          </div>
        </div>

        {/* Email Signup */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8 border border-gray-200">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-gray-600 mb-6">
              Get tips and strategies for becoming debt-free faster.
            </p>
            <form className="max-w-md mx-auto flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for pages you haven't built yet
const DebtsPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Debts Tracker</h1>
      <p className="text-gray-600">Coming soon - track all your debts in one place</p>
    </div>
  </div>
);

const SnowballPage = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Debt Snowball Calculator</h1>
      <p className="text-gray-600">Coming soon - step-by-step debt payoff plan</p>
    </div>
  </div>
);

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentArticle, setCurrentArticle] = useState(null);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setCurrentArticle(null); // Reset article when changing pages
  };

  const handleArticleChange = (article) => {
    setCurrentArticle(article);
  };

  const renderCurrentPage = () => {
    // If we're viewing an article, show that
    if (currentArticle) {
      switch (currentArticle) {
        case 'spending-habits':
          return <SpendingHabitsArticle onBack={() => setCurrentArticle(null)} onPageChange={handlePageChange} />;
        default:
          return <LibraryIndex onArticleChange={handleArticleChange} onPageChange={handlePageChange} />;
      }
    }

    // Otherwise show the main page
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={handlePageChange} />;
      case 'debts':
        return <DebtsPage />;
      case 'snowball':
        return <SnowballPage />;
      case 'what-if':
        return <WhatIfMachine onPageChange={handlePageChange} />;
      case 'library':
        return <LibraryIndex onArticleChange={handleArticleChange} onPageChange={handlePageChange} />;
      default:
        return <HomePage onPageChange={handlePageChange} />;
    }
  };

  return (
    <div className="App">
      <Navigation currentPage={currentPage} onPageChange={handlePageChange} />
      {renderCurrentPage()}
    </div>
  );
}

export default App;