import React, { useState } from 'react';
import './App.css';
import DebtTracker from './components/DebtTracker';
import WhatIfMachine from './pages/WhatIfMachine';
import Library from './pages/Library';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="App">
            <header className="hero">
              <h1>TrySnowball</h1>
              <p>Debt payoff made simple. Make better decisions. Get back in control.</p>
              <a href="#signup" className="cta">Join the waitlist</a>
            </header>

            <section className="intro">
              <h2>What is TrySnowball?</h2>
              <p>TrySnowball is a debt payoff planner, scenario modeller, and accountability coach—designed to help you clear debt faster and stay motivated.</p>
            </section>

            <section className="teaser">
              <h2>Coming Soon: The What If Machine</h2>
              <p>Wondering what happens if you skip takeaways for a month or cancel that unused subscription? See how small changes stack up to big progress.</p>
              <a href="#whatif">Preview</a>
            </section>

            <section id="signup" className="signup">
              <h2>Be the first to try it</h2>
              <form name="signup" method="POST" data-netlify="true">
                <input type="hidden" name="form-name" value="signup" />
                <input type="email" name="email" placeholder="Your email" required />
                <button type="submit">Join the waitlist</button>
              </form>
            </section>

            <footer>
              <p>© {new Date().getFullYear()} TrySnowball. Built in the UK.</p>
            </footer>
          </div>
        );

      case 'debts':
        return <DebtTracker onPageChange={setCurrentPage} />;
      case 'what-if':
        return <WhatIfMachine onPageChange={setCurrentPage} />;
      case 'library':
        return <Library />;
      default:
        return <div className="p-10 text-center text-gray-600">Page not found.</div>;
    }
  };

  return (
    <div>
      {/* Top nav to switch pages */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button 
              onClick={() => setCurrentPage('home')}
              className="text-2xl font-bold text-blue-600 hover:text-blue-700"
            >
              TrySnowball
            </button>
            <div className="flex space-x-6">
              {[
                ['home', 'Home'],
                ['what-if', 'What If Machine'],
                ['library', 'Library'],
                ['books', 'Books'],
                ['debts', 'My Debts'],
              ].map(([page, label]) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Render selected page */}
      {renderPage()}
    </div>
  );
}

export default App;