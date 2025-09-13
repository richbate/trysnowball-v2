/**
 * Library - Learning & Value-Add Hub
 * Educational content and affiliate monetization with glassmorphism theme
 */

import React, { useState } from 'react';

interface Article {
  id: string;
  title: string;
  description: string;
  readTime: string;
  category: 'Strategy' | 'Psychology' | 'Tools' | 'Success';
  icon: string;
  url: string;
}

interface Tip {
  id: string;
  title: string;
  description: string;
  actionable: string;
  icon: string;
}

interface AffiliateLink {
  id: string;
  title: string;
  description: string;
  benefit: string;
  cta: string;
  icon: string;
  url: string;
  disclaimer: string;
}

export const Library: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const articles: Article[] = [
    {
      id: 'debt-snowball-vs-avalanche',
      title: 'Debt Snowball vs Avalanche: Which Strategy Wins?',
      description: 'Compare the two most popular debt payoff strategies and find which works best for your situation.',
      readTime: '5 min read',
      category: 'Strategy',
      icon: '⚖️',
      url: '/articles/snowball-vs-avalanche'
    },
    {
      id: 'psychology-of-debt',
      title: 'The Psychology Behind Debt Payoff Success',
      description: 'Understand the mental aspects that drive successful debt elimination and build lasting habits.',
      readTime: '7 min read',
      category: 'Psychology',
      icon: '🧠',
      url: '/articles/psychology-of-debt'
    },
    {
      id: 'balance-transfers',
      title: 'Balance Transfer Calculator & Strategy Guide',
      description: 'Learn when balance transfers make sense and how to use them effectively in your debt plan.',
      readTime: '6 min read',
      category: 'Tools',
      icon: '🔄',
      url: '/articles/balance-transfers'
    },
    {
      id: 'debt-free-stories',
      title: 'Real Debt-Free Success Stories',
      description: 'Get inspired by real people who eliminated their debt using strategic payoff plans.',
      readTime: '4 min read',
      category: 'Success',
      icon: '🎉',
      url: '/articles/success-stories'
    }
  ];

  const tips: Tip[] = [
    {
      id: 'automate-payments',
      title: 'Automate Your Debt Payments',
      description: 'Set up automatic payments to ensure you never miss a due date and consistently make progress.',
      actionable: 'Set up autopay for all your minimum payments this week',
      icon: '🤖'
    },
    {
      id: 'found-money',
      title: 'Turn Found Money into Debt Payments',
      description: 'Use windfalls, tax refunds, and unexpected income to accelerate your debt payoff.',
      actionable: 'Commit to putting 50% of any windfall toward debt',
      icon: '💰'
    },
    {
      id: 'track-progress',
      title: 'Visualize Your Progress Weekly',
      description: 'Regular progress tracking keeps you motivated and helps identify what\'s working.',
      actionable: 'Review your debt balances every Friday and celebrate wins',
      icon: '📊'
    },
    {
      id: 'side-hustle',
      title: 'Start a Debt-Focused Side Hustle',
      description: 'Generate extra income with the sole purpose of accelerating your debt elimination.',
      actionable: 'Research 3 side hustle ideas that match your skills',
      icon: '🚀'
    }
  ];

  const affiliateLinks: AffiliateLink[] = [
    {
      id: 'credit-monitoring',
      title: 'Free Credit Score Monitoring',
      description: 'Track your credit score improvements as you pay down debt.',
      benefit: 'See your progress in real-time',
      cta: 'Get Your Free Score',
      icon: '📈',
      url: 'https://example.com/credit-score',
      disclaimer: 'We may receive compensation if you sign up through this link.'
    },
    {
      id: 'budgeting-app',
      title: 'Recommended Budgeting App',
      description: 'Connect your accounts and automatically categorize spending to find more money for debt.',
      benefit: 'Find an extra £200/month on average',
      cta: 'Start Free Trial',
      icon: '💳',
      url: 'https://example.com/budgeting-app',
      disclaimer: 'We may receive compensation if you sign up through this link.'
    },
    {
      id: 'debt-consolidation',
      title: 'Compare Personal Loan Rates',
      description: 'See if you qualify for a lower interest rate to consolidate high-interest debt.',
      benefit: 'Could save thousands in interest',
      cta: 'Check Your Rate',
      icon: '🏦',
      url: 'https://example.com/personal-loans',
      disclaimer: 'We may receive compensation if you apply through this link.'
    }
  ];

  const categories = ['all', 'Strategy', 'Psychology', 'Tools', 'Success'];

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(article => article.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Strategy': return 'blue';
      case 'Psychology': return 'purple';
      case 'Tools': return 'green';
      case 'Success': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Learning Library</h1>
          <p className="text-white/80">
            Expert guides, actionable tips, and tools to accelerate your debt-free journey
          </p>
        </div>

        {/* Featured Articles Section */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Featured Articles</h2>
              
              {/* Category Filter */}
              <div className="flex gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedCategory === category
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {category === 'all' ? 'All' : category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredArticles.map(article => (
                <div key={article.id} className="bg-white/10 rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{article.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r from-${getCategoryColor(article.category)}-400 to-${getCategoryColor(article.category)}-600`}>
                          {article.category}
                        </div>
                        <span className="text-white/60 text-sm">{article.readTime}</span>
                      </div>
                      <h3 className="text-white font-semibold mb-2">{article.title}</h3>
                      <p className="text-white/70 text-sm mb-4">{article.description}</p>
                      <button className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors">
                        Read Article →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Tips Section */}
        <div className="mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Win Tips</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              {tips.map(tip => (
                <div key={tip.id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{tip.icon}</span>
                    <div>
                      <h3 className="text-white font-semibold text-sm mb-1">{tip.title}</h3>
                      <p className="text-white/70 text-xs mb-2">{tip.description}</p>
                      <div className="bg-green-400/20 border border-green-400/30 rounded-lg p-2">
                        <p className="text-green-400 text-xs font-medium">
                          💡 Action: {tip.actionable}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Affiliate Links Section */}
        <div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-2">Recommended Tools</h2>
            <p className="text-white/70 text-sm mb-6">
              Carefully selected tools and services to support your debt-free journey
            </p>
            
            <div className="space-y-4">
              {affiliateLinks.map(link => (
                <div key={link.id} className="bg-gradient-to-r from-white/5 to-white/10 rounded-xl p-6 border border-white/20 hover:from-white/10 hover:to-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{link.icon}</span>
                      <div>
                        <h3 className="text-white font-semibold mb-1">{link.title}</h3>
                        <p className="text-white/70 text-sm mb-2">{link.description}</p>
                        <p className="text-green-400 text-sm font-medium">{link.benefit}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl mb-2">
                        {link.cta}
                      </button>
                      <p className="text-white/50 text-xs max-w-xs">
                        {link.disclaimer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* General Disclaimer */}
            <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/20">
              <p className="text-white/60 text-xs">
                <strong>Disclosure:</strong> Some links on this page are affiliate links. 
                This means we may receive a commission if you make a purchase through these links, 
                at no additional cost to you. We only recommend products and services we believe 
                will help you achieve your debt-free goals. All recommendations are based on our 
                research and user feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};