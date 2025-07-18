import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('latest');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch articles from JSON file
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/articles.json');
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error('Error fetching articles:', error);
        // Fallback to empty array if fetch fails
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);


  const toolsAndResources = [
    { 
      title: 'TrySnowball What If Machine', 
      desc: 'Free UK debt snowball calculator with realistic scenarios. See exactly when you\'ll be debt-free.',
      link: '/what-if',
      price: 'Free',
      badge: 'Recommended',
      internal: true
    },
    { 
      title: 'StepChange Debt Remedy', 
      desc: 'Free debt advice tool from the UK\'s leading debt charity. Trusted by millions.',
      link: 'https://www.stepchange.org/debt-remedy.aspx',
      price: 'Free',
      badge: 'Charity'
    },
    { 
      title: 'Citizens Advice Debt Test', 
      desc: 'Quick assessment tool to understand your debt situation and get personalized advice.',
      link: 'https://www.citizensadvice.org.uk/debt-and-money/',
      price: 'Free',
      badge: 'Trusted'
    },
    { 
      title: 'Money Helper Budget Planner', 
      desc: 'Official UK government budget planner. Free tool from Money and Pensions Service.',
      link: 'https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner',
      price: 'Free',
      badge: 'Official UK'
    },
    { 
      title: 'CheckMyFile Credit Report', 
      desc: 'Complete UK credit report from all 4 agencies: Experian, Equifax, TransUnion, and Crediva.',
      link: 'https://www.checkmyfile.com',
      price: 'Free Trial',
      badge: 'Complete'
    },
    { 
      title: 'Snoop Money App', 
      desc: 'AI-powered spending insights and money-saving recommendations. Find subscriptions you forgot about.',
      link: 'https://www.snoop.app',
      price: 'Free',
      badge: 'AI-Powered'
    },
    { 
      title: 'UK Debt Charities Directory', 
      desc: 'Complete list of free UK debt advice charities including StepChange, Citizens Advice, and National Debtline.',
      link: 'https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt/debt-advice-locator',
      price: 'Free',
      badge: 'Official'
    },
    { 
      title: 'Debt Consolidation Calculator', 
      desc: 'Compare debt consolidation options vs. snowball method. Calculate which saves more money.',
      link: 'https://www.moneysavingexpert.com/loans/debt-consolidation-loans/',
      price: 'Free',
      badge: 'MSE'
    },
    { 
      title: 'Mental Health & Debt Support', 
      desc: 'Free mental health support for debt-related stress. Mind charity resources and helplines.',
      link: 'https://www.mind.org.uk/information-support/types-of-mental-health-problems/money-and-mental-health/',
      price: 'Free',
      badge: 'Mental Health'
    },
    { 
      title: 'Debt Snowball Template', 
      desc: 'Free Google Sheets template to track your debt snowball progress and payments.',
      link: 'https://docs.google.com/spreadsheets/d/1KAAelRNafsgjEQFYdRKIbJfU7pNOoQaB/edit#gid=0',
      price: 'Free',
      badge: 'Template'
    }
  ];

  const books = [
    { 
      title: 'The Total Money Makeover', 
      author: 'Dave Ramsey',
      desc: 'The original debt snowball method explained step-by-step. Over 5 million copies sold worldwide.',
      link: 'https://amzn.to/4eRAiJe',
      price: '£12.99',
      badge: 'Snowball Original'
    },
    { 
      title: 'Your Money or Your Life', 
      author: 'Vicki Robin & Joe Dominguez',
      desc: 'Transform your relationship with money. The philosophy behind sustainable debt freedom.',
      link: 'https://amzn.to/4kPX7OV',
      price: '£14.99',
      badge: 'Life-changing'
    },
    { 
      title: 'The Richest Man in Babylon', 
      author: 'George S. Clason',
      desc: 'Timeless money wisdom in simple parables. The foundation of personal finance.',
      link: 'https://amzn.to/464HD5U',
      price: '£8.99',
      badge: 'Classic'
    },
    { 
      title: 'Broke Millennial', 
      author: 'Erin Lowry',
      desc: 'Debt elimination strategies for younger generations. Practical and relatable approach.',
      link: 'https://amzn.to/45XCcFI',
      price: '£13.99',
      badge: 'Modern'
    },
    { 
      title: 'Rich Dad Poor Dad', 
      author: 'Robert Kiyosaki',
      desc: 'A paradigm-shifting book about money, wealth, and the mindset difference between the rich and poor.',
      link: 'https://amzn.to/4nN4TLQ',
      price: '£9.99',
      badge: 'Bestseller'
    },
    { 
      title: 'Debt: The First 5000 Years', 
      author: 'David Graeber',
      desc: 'A groundbreaking exploration of debt throughout human history and its impact on society.',
      link: 'https://amzn.to/4532m8W',
      price: '£12.99',
      badge: 'Academic'
    }
  ];


  const tabs = [
    { id: 'latest', label: 'Substack', count: 'newsletter' },
    { id: 'tools', label: 'Free UK Tools & Resources', count: toolsAndResources.length },
    { id: 'books', label: 'Recommended Books', count: books.length },
  ];


  const renderLatestPosts = () => (
    <div className="space-y-8">
      {/* Newsletter Signup Header */}
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest from Substack</h2>
          <p className="text-lg text-gray-600 mb-6">
            Get fresh perspectives on debt elimination, spending psychology, and financial freedom delivered straight to your inbox.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-6">
            <span>✅ Weekly debt freedom tips</span>
            <span>✅ Real UK case studies</span>
            <span>✅ Psychology-backed strategies</span>
            <span>✅ No spam, ever</span>
          </div>
        </div>
        
        {/* Substack Articles List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading articles...</div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No articles found.</div>
            </div>
          ) : (
            articles.map((article, index) => {
              // Helper function to get category colors
              const getCategoryColors = (color) => {
                const colors = {
                  blue: 'bg-blue-100 text-blue-800',
                  green: 'bg-green-100 text-green-800',
                  purple: 'bg-purple-100 text-purple-800',
                  red: 'bg-red-100 text-red-800',
                  yellow: 'bg-yellow-100 text-yellow-800',
                  indigo: 'bg-indigo-100 text-indigo-800'
                };
                return colors[color] || 'bg-gray-100 text-gray-800';
              };

              // Format date
              const formatDate = (dateString) => {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', { 
                  month: 'short', 
                  year: 'numeric' 
                });
              };

              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span>{formatDate(article.publishedDate)}</span>
                        <span className="mx-2">•</span>
                        <span>{article.readTime}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColors(article.categoryColor)}`}>
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Read on Substack →
                  </a>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Join thousands of readers who get actionable debt freedom insights every week.
          </p>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-3">Ready to Start Your Debt-Free Journey?</h3>
        <p className="text-lg mb-6 opacity-90">
          Combine our free tools with weekly insights to accelerate your path to financial freedom.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button 
            onClick={() => navigate('/what-if')}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Try the What If Machine
          </button>
          <button 
            onClick={() => navigate('/baby-steps')}
            className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
          >
            See Baby Steps
          </button>
        </div>
      </div>
    </div>
  );


  const renderTools = () => (
    <div className="space-y-8">
      {/* Important Disclaimer */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>This tool is intended to help users find the most efficient way to pay off their debts using the snowball method. If you are struggling with debt, feeling overwhelmed, or need professional advice, please contact a debt charity immediately:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li><strong>StepChange:</strong> 0800 138 1111 (free debt advice)</li>
                <li><strong>Citizens Advice:</strong> 0800 144 8848 (free helpline)</li>
                <li><strong>National Debtline:</strong> 0808 808 4000 (free confidential advice)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {toolsAndResources.map((tool, index) => (
          <div key={index} className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="inline-block px-3 py-1 text-xs bg-green-100 text-green-600 rounded-full font-medium">
                {tool.badge}
              </span>
              <span className="text-sm font-semibold text-gray-900">{tool.price}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.title}</h3>
            <p className="text-gray-600 mb-4">{tool.desc}</p>
            {tool.internal ? (
              <button 
                onClick={() => navigate(tool.link)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Try it now →
              </button>
            ) : (
              <a 
                href={tool.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Visit tool →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="space-y-6">
      {/* Affiliate Disclosure */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Affiliate Disclosure:</strong> The book links below are Amazon affiliate links. I may receive a small commission if you purchase through these links, at no extra cost to you. This helps support the development of TrySnowball's free debt management tools.
            </p>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {books.map((book, index) => (
          <div key={index} className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="inline-block px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-full font-medium">
                {book.badge}
              </span>
              <span className="text-sm font-semibold text-gray-900">{book.price}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
            <p className="text-sm text-gray-500 mb-2">by {book.author}</p>
            <p className="text-gray-600 mb-4">{book.desc}</p>
            <a 
              href={book.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Buy on Amazon →
            </a>
          </div>
        ))}
      </div>
    </div>
  );


  const renderContent = () => {
    switch(activeTab) {
      case 'latest': return renderLatestPosts();
      case 'tools': return renderTools();
      case 'books': return renderBooks();
      default: return renderLatestPosts();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Pay Off Debt, One Step at a Time.
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
              Try the debt snowball method — simple, proven, and made for real life.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <span>✅ Backed by Northwestern University research</span>
              <span>✅ Proven by Harvard Business Review</span>
              <span>✅ Free UK debt tools & resources</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-sm transform scale-105'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="transition-all duration-300">
          {renderContent()}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg">
          <h3 className="text-2xl font-bold mb-3">Ready to Start Your Debt-Free Journey?</h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of UK residents who've used the research-backed snowball method to eliminate debt faster.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/what-if')}
              className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Try the What If Machine
            </button>
            <button 
              onClick={() => navigate('/baby-steps')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              See Baby Steps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;