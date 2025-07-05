import React from 'react';

const LibraryIndex = ({ onArticleChange, onPageChange }) => {
  const articles = [
    {
      id: 'spending-habits',
      title: 'Where Does Your Money Actually Go?',
      description: 'Discover the hidden spending leaks that keep you stuck in debt — and the simple fixes that free up hundreds each month.',
      tag: 'Spending',
      tagColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'audit-spending',
      title: 'The No-Shame Spending Audit',
      description: 'A guilt-free way to review your expenses and spot opportunities without beating yourself up.',
      tag: 'Spending',
      tagColor: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'saving-vs-debt',
      title: 'Emergency Fund vs. Debt Payoff: Which Comes First?',
      description: 'The counter-intuitive truth about why saving while in debt might be costing you thousands.',
      tag: 'Strategy',
      tagColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'found-money',
      title: 'Found Money: 12 Tiny Changes That Add Up Big',
      description: 'From subscription audits to grocery hacks — every pound you find is a pound toward freedom.',
      tag: 'Strategy',
      tagColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'snowball-vs-avalanche',
      title: 'Snowball vs. Avalanche: Why Psychology Beats Math',
      description: 'The mathematically optimal method isn\'t always the best. Here\'s how to choose the strategy that actually works for you.',
      tag: 'Debt',
      tagColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'minimum-payments',
      title: 'The Minimum Payment Trap — And How to Escape It',
      description: 'Why minimum payments are designed to keep you in debt, and what to do instead.',
      tag: 'Debt',
      tagColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'compound-interest',
      title: 'How Compound Interest Becomes Your Worst Enemy',
      description: 'The hidden force that makes your debt grow faster than you think — and how to turn it around.',
      tag: 'Debt',
      tagColor: 'bg-red-100 text-red-800'
    },
    {
      id: 'debt-shame',
      title: 'Breaking Free from Debt Shame',
      description: 'Why guilt keeps you stuck and how to replace shame with actionable steps toward financial freedom.',
      tag: 'Mindset',
      tagColor: 'bg-purple-100 text-purple-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📖 Library
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master your money. No lectures, no jargon — just real strategies that work.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 mb-12">
          {articles.map((article) => (
            <div key={article.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${article.tagColor}`}>
                  {article.tag}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900