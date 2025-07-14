// src/pages/Library.js

import React from 'react';

const articles = [
  {
    tag: 'Spending',
    href: 'spending-habits.html',
    title: 'Where Does It All Go? The Truth About Your Monthly Spending Habits',
    description: 'Explore the everyday spending leaks that keep people stuck in debt — and what to do instead.'
  },
  {
    tag: 'Spending',
    href: 'audit-spending.html',
    title: 'How to Audit Your Spending Without Shame or Guilt',
    description: 'A practical, no-blame guide to reviewing your expenses and spotting opportunity.'
  },
  {
    tag: 'Saving',
    href: 'saving-vs-debt.html',
    title: 'Why Saving Before You’re Debt-Free Might Be Slowing You Down',
    description: 'Emergency fund or debt payoff? Here\'s how to know what comes first.'
  },
  {
    tag: 'Saving',
    href: 'found-money.html',
    title: 'Found Money: 10 Tiny Lifestyle Changes That Unlock Big Wins',
    description: 'From skipping takeaways to cancelling subscriptions — every pound counts.'
  },
  {
    tag: 'Debt',
    href: 'snowball-vs-avalanche.html',
    title: 'The Snowball vs. Avalanche Debate — And Why Emotion Beats Math',
    description: 'Which method works best, and why the one with the best maths isn\'t always the winner.'
  },
  {
    tag: 'Debt',
    href: 'minimum-payment-trap.html',
    title: 'Why Minimum Payments Are a Trap — and How to Escape Them',
    description: 'Minimums aren’t designed to help you — learn what they’re really doing to your debt.'
  }
];

export default function Library() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Library</h1>
      <p className="text-gray-600 mb-6">Master your money. No lectures, no jargon — just real strategies that work.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        {articles.map((article, i) => (
          <div key={i} className="border rounded-lg p-6 bg-white shadow-sm">
            <span className="text-xs font-semibold text-blue-600 uppercase">{article.tag}</span>
            <a href={article.href}>
              <h2 className="text-lg font-bold mt-2 mb-1 hover:underline">{article.title}</h2>
            </a>
            <p className="text-sm text-gray-700">{article.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}