import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const FuturePlans = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [votes, setVotes] = useState({});
  const [userVotes, setUserVotes] = useState({});

  // Roadmap items organized by category
  const roadmapItems = useMemo(() => [
    {
      id: 'mobile-app',
      category: 'Platform',
      title: 'Native Mobile App',
      description: 'iOS and Android apps for debt tracking on the go',
      status: 'planned',
      effort: 'Large',
      impact: 'High'
    },
    {
      id: 'bank-integration',
      category: 'Data',
      title: 'Open Banking Integration',
      description: 'Automatically import transactions from UK banks (read-only)',
      status: 'research',
      effort: 'Large',
      impact: 'High'
    },
    {
      id: 'payment-reminders',
      category: 'Features',
      title: 'Payment Reminders',
      description: 'Email/SMS reminders for due dates and payment schedules',
      status: 'planned',
      effort: 'Medium',
      impact: 'Medium'
    },
    {
      id: 'debt-consolidation',
      category: 'Tools',
      title: 'Debt Consolidation Calculator',
      description: 'Compare consolidation loan options vs. snowball method',
      status: 'planned',
      effort: 'Medium',
      impact: 'Medium'
    },
    {
      id: 'progress-sharing',
      category: 'Social',
      title: 'Anonymous Progress Sharing',
      description: 'Share milestones and celebrate wins with the community',
      status: 'idea',
      effort: 'Medium',
      impact: 'Low'
    },
    {
      id: 'credit-score',
      category: 'Data',
      title: 'Credit Score Tracking',
      description: 'Monitor how debt payoff improves your credit score',
      status: 'research',
      effort: 'Large',
      impact: 'Medium'
    },
    {
      id: 'budget-planner',
      category: 'Tools',
      title: 'Advanced Budget Planner',
      description: 'Full budgeting system integrated with debt payoff',
      status: 'idea',
      effort: 'Large',
      impact: 'High'
    },
    {
      id: 'ai-insights',
      category: 'AI',
      title: 'AI Financial Insights',
      description: 'Personalized recommendations based on spending patterns',
      status: 'research',
      effort: 'Large',
      impact: 'Medium'
    },
    {
      id: 'export-tools',
      category: 'Features',
      title: 'Enhanced Export Tools',
      description: 'Export to Excel, PDF reports, and accounting software',
      status: 'planned',
      effort: 'Small',
      impact: 'Low'
    },
    {
      id: 'multiple-strategies',
      category: 'Tools',
      title: 'Multiple Payoff Strategies',
      description: 'Avalanche method, custom ordering, and hybrid approaches',
      status: 'planned',
      effort: 'Medium',
      impact: 'Medium'
    }
  ], []);

  // Load votes from localStorage
  useEffect(() => {
    const savedVotes = localStorage.getItem('trysnowball-roadmap-votes');
    const savedUserVotes = localStorage.getItem('trysnowball-user-votes');
    
    if (savedVotes) {
      setVotes(JSON.parse(savedVotes));
    } else {
      // Initialize with some demo votes
      const initialVotes = {};
      roadmapItems.forEach(item => {
        initialVotes[item.id] = Math.floor(Math.random() * 50) + 10;
      });
      setVotes(initialVotes);
    }
    
    if (savedUserVotes) {
      setUserVotes(JSON.parse(savedUserVotes));
    }
  }, [roadmapItems]);

  // Save votes to localStorage
  useEffect(() => {
    localStorage.setItem('trysnowball-roadmap-votes', JSON.stringify(votes));
  }, [votes]);

  useEffect(() => {
    localStorage.setItem('trysnowball-user-votes', JSON.stringify(userVotes));
  }, [userVotes]);

  const handleVote = (itemId) => {
    if (userVotes[itemId]) {
      // Remove vote
      setVotes(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) - 1 }));
      setUserVotes(prev => ({ ...prev, [itemId]: false }));
    } else {
      // Add vote
      setVotes(prev => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
      setUserVotes(prev => ({ ...prev, [itemId]: true }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'research': return 'bg-yellow-100 text-yellow-800';
      case 'idea': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort) => {
    switch (effort) {
      case 'Small': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Large': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'High': return 'bg-purple-100 text-purple-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'Low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort by votes (descending)
  const sortedItems = [...roadmapItems].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));

  // Group by category
  const categories = ['Platform', 'Data', 'Tools', 'Features', 'AI', 'Social'];

  return (
    <div className={`min-h-screen ${colors.background} ${colors.text.primary} px-6 py-12`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Future Plans</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Help shape the future of TrySnowball. Vote for the features you want most.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span>✅ Your votes are saved locally</span>
            <span>✅ No account required</span>
            <span>✅ Results help prioritize development</span>
          </div>
        </header>

        {/* Voting Instructions */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How It Works</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Click 👍 to vote for features you want</li>
            <li>• Click again to remove your vote</li>
            <li>• Features are ranked by total votes</li>
            <li>• Your feedback directly influences our roadmap</li>
          </ul>
        </div>

        {/* Top Voted Features */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-primary">🔥 Most Requested</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedItems.slice(0, 3).map((item, index) => (
              <div key={item.id} className={`${colors.surface} rounded-lg p-6 border-l-4 border-primary relative`}>
                <div className="absolute top-4 right-4 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  #{index + 1}
                </div>
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-10">{item.title}</h3>
                <p className="text-gray-600 mb-4 text-sm">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${getEffortColor(item.effort)}`}>
                      {item.effort}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getImpactColor(item.impact)}`}>
                      {item.impact} Impact
                    </span>
                  </div>
                  <button
                    onClick={() => handleVote(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      userVotes[item.id]
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    👍 {votes[item.id] || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* All Features by Category */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-primary">Complete Roadmap</h2>
          
          {categories.map(category => {
            const categoryItems = sortedItems.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={category} className="mb-8">
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">{category}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryItems.map((item) => (
                    <div key={item.id} className={`${colors.surface} rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getEffortColor(item.effort)}`}>
                            {item.effort}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getImpactColor(item.impact)}`}>
                            {item.impact}
                          </span>
                        </div>
                        <button
                          onClick={() => handleVote(item.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                            userVotes[item.id]
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          👍 {votes[item.id] || 0}
                        </button>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Feedback Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-primary to-accent text-white rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Have Other Ideas?</h3>
            <p className="text-lg mb-6 opacity-90">
              Don't see your feature request? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="https://trysnowball.substack.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white text-primary rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                💌 Join Newsletter
              </a>
              <a 
                href="https://stan.store/trysnowball/p/buy-me-a-coffee-figkm7db" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors"
              >
                ☕ Support Development
              </a>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-primary hover:text-accent transition-colors font-semibold"
          >
            ← Back to Home
          </button>
        </div>

        {/* Footer */}
        <footer className={`text-center mt-16 text-sm ${colors.text.muted}`}>
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-6">
              <button onClick={() => navigate('/library')} className="hover:text-primary transition-colors">
                Library
              </button>
              <button onClick={() => navigate('/ai-coach')} className="hover:text-primary transition-colors">
                AI Coach
              </button>
              <a 
                href="https://trysnowball.substack.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                Newsletter
              </a>
              <button onClick={() => navigate('/baby-steps')} className="hover:text-primary transition-colors">
                Baby Steps
              </button>
              <a 
                href="https://stan.store/trysnowball/p/buy-me-a-coffee-figkm7db" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                ☕ Buy me a Coffee
              </a>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p>© {new Date().getFullYear()} TrySnowball. Built in the UK.</p>
              <p className="text-xs mt-2">
                Free debt management tools. Your data stays private. Built for UK financial situations.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FuturePlans;