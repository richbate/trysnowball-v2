import React from 'react';
import { Link } from 'react-router-dom';
import LibraryLayout from './LibraryLayout';
import { ARTICLES } from '../../data/articlesIndex';

export default function LibraryIndexPage() {
  return (
    <LibraryLayout>
      <div className="grid gap-6">
        {ARTICLES.map(article => (
          <Link key={article.slug} to={`/library/${article.slug}`} className="block rounded-2xl border p-5 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p className="text-gray-600 mt-1">{article.summary}</p>
            <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">{article.category}</span>
              <span>Read →</span>
            </div>
          </Link>
        ))}
      </div>
    </LibraryLayout>
  );
}