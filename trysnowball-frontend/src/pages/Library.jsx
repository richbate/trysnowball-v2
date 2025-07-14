import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Library = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('research');

  // SEO-focused content sections
  const researchContent = [
    {
      title: "Why the Debt Snowball Method Works",
      subtitle: "Scientific Research & UK Statistics",
      content: (
        <div className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-400 p-6">
            <h3 className="text-xl font-bold text-red-900 mb-3">🚨 The UK Debt Crisis in 2025</h3>
            <div className="space-y-3 text-red-800">
              <p className="text-lg font-semibold">• The average UK household owes £65,529 in personal debt</p>
              <p className="text-lg font-semibold">• 8.1 million UK adults (15% of the population) need debt advice</p>
              <p className="text-lg font-semibold">• Personal debt averages £34,597 per British adult</p>
            </div>
            <p className="text-sm text-red-700 mt-4">
              Sources: <a href="https://www.moneyandpensionsservice.org.uk/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600">Money and Pensions Service</a> • 
              <a href="https://commonslibrary.parliament.uk/research-briefings/cbp-8285/" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-600 ml-2">House of Commons Library</a>
            </p>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-3">🎓 Academic Research Supporting the Snowball Method</h3>
            <div className="space-y-4 text-blue-800">
              <div>
                <p className="font-semibold">Northwestern University Kellogg School of Management (2012)</p>
                <p>"Consumers who tackle small balances first are likelier to eliminate their overall debt"</p>
                <a href="https://www.occu.org/blog/paying-down-debt-why-the-snowball-method-works" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">Read the full research →</a>
              </div>
              <div>
                <p className="font-semibold">Harvard Business Review Study</p>
                <p>"The snowball method actually proved to be the most effective strategy for debt elimination"</p>
                <a href="https://hbr.org/2016/12/research-the-best-strategy-for-paying-off-credit-card-debt" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">View Harvard findings →</a>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-6">
            <h3 className="text-xl font-bold text-green-900 mb-3">🧠 Why Psychology Beats Mathematics</h3>
            <div className="space-y-3 text-green-800">
              <p>The debt snowball method works because it leverages <strong>behavioral psychology</strong> rather than just mathematical optimization.</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Quick wins build momentum:</strong> Paying off smaller debts first creates psychological victories</li>
                <li><strong>Simplified focus:</strong> Fewer accounts to manage reduces decision fatigue</li>
                <li><strong>Motivation maintenance:</strong> Visible progress prevents abandonment of the debt payoff plan</li>
                <li><strong>Emotional satisfaction:</strong> The feeling of "closing accounts" provides dopamine rewards</li>
              </ul>
              <p className="mt-4 font-semibold">Result: Higher completion rates than the mathematically "optimal" avalanche method</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const articles = [
    { 
      tag: 'UK Debt Crisis', 
      title: 'UK Debt Statistics 2025: The Complete Picture', 
      desc: 'Latest data from Parliament, Money and Pensions Service, and StepChange on the UK debt crisis.',
      readTime: '8 min',
      keywords: 'UK debt statistics, debt crisis UK, personal debt UK',
      externalLink: 'https://commonslibrary.parliament.uk/research-briefings/cbp-8285/',
      content: "With 8.1 million UK adults needing debt advice and household debt averaging £65,529, the UK faces an unprecedented debt crisis..."
    },
    { 
      tag: 'Debt Method', 
      title: 'Debt Snowball vs Avalanche: Which Works Better?', 
      desc: 'Research from Northwestern University and Harvard Business Review proves why the snowball method is more effective.',
      readTime: '10 min',
      keywords: 'debt snowball vs avalanche, debt payoff method, debt elimination strategy',
      externalLink: 'https://hbr.org/2016/12/research-the-best-strategy-for-paying-off-credit-card-debt',
      content: "Harvard Business Review researchers found that the snowball method proved to be the most effective strategy..."
    },
    { 
      tag: 'Psychology', 
      title: 'The Psychology of Debt Repayment', 
      desc: 'Why behavioral psychology trumps mathematical optimization in debt elimination.',
      readTime: '7 min',
      keywords: 'debt psychology, debt behavior, debt repayment psychology',
      externalLink: 'https://www.occu.org/blog/paying-down-debt-why-the-snowball-method-works',
      content: "Northwestern University's Kellogg School research shows consumers who tackle small balances first are likelier to eliminate overall debt..."
    },
    { 
      tag: 'UK Resources', 
      title: 'Government Debt Help: Your Rights & Resources', 
      desc: 'Official UK government resources for debt advice, including FCA guidelines and Citizens Advice support.',
      readTime: '6 min',
      keywords: 'UK debt help, government debt advice, debt rights UK',
      externalLink: 'https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt',
      content: "The UK government provides free debt advice through Money Helper and Citizens Advice..."
    }
  ];

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
    }
  ];


  const tabs = [
    { id: 'research', label: '🎓 Research & Statistics', count: '4 studies' },
    { id: 'articles', label: '📚 In-Depth Articles', count: articles.length },
    { id: 'tools', label: '🛠️ Free UK Tools & Resources', count: toolsAndResources.length },
    { id: 'books', label: '📖 Recommended Books', count: books.length },
  ];

  const renderResearch = () => (
    <div className="space-y-8">
      {researchContent.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
          <p className="text-lg text-gray-600 mb-6">{item.subtitle}</p>
          {item.content}
        </div>
      ))}
      
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Try Our Research-Backed Calculator</h2>
        <p className="text-gray-600 mb-6">
          Put this research into action with our free debt snowball calculator. 
          Based on the proven methods from Northwestern University and Harvard Business Review.
        </p>
        <button 
          onClick={() => navigate('/what-if')}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          🚀 Try the What If Machine
        </button>
      </div>
    </div>
  );

  const renderArticles = () => (
    <div className="grid gap-6">
      {articles.map((article, index) => (
        <div key={index} className="p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <span className="inline-block px-3 py-1 text-xs uppercase bg-blue-100 text-blue-600 rounded-full font-medium">
              {article.tag}
            </span>
            <span className="text-sm text-gray-500">{article.readTime}</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{article.title}</h3>
          <p className="text-gray-600 mb-4">{article.desc}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Keywords: {article.keywords}</span>
            <a 
              href={article.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Read research →
            </a>
          </div>
        </div>
      ))}
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
            📚 Buy on Amazon →
          </a>
        </div>
      ))}
    </div>
  );


  const renderContent = () => {
    switch(activeTab) {
      case 'research': return renderResearch();
      case 'articles': return renderArticles();
      case 'tools': return renderTools();
      case 'books': return renderBooks();
      default: return renderResearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              UK Debt Snowball Method: Research-Backed Debt Elimination
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto mb-6">
              With 8.1 million UK adults needing debt advice and household debt averaging £65,529, 
              discover the scientifically proven debt snowball method that helped millions achieve debt freedom.
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
              🚀 Try the What If Machine
            </button>
            <button 
              onClick={() => navigate('/analyser')}
              className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              🔍 Analyse Your Spending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;