import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

const Article = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/articles.json')
      .then(res => res.json())
      .then(data => {
        const found = data.articles.find(a => a.slug === slug);
        setArticle(found || null);
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (!article) return <div className="p-8 text-center text-red-500">Article not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Navigation */}
        <div className="mb-8">
          <Link to="/library" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Library
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-10 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              article.categoryColor === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300' :
              article.categoryColor === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300' :
              article.categoryColor === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:bg-opacity-30 dark:text-purple-300' :
              article.categoryColor === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300' :
              article.categoryColor === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-300' :
              'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:bg-opacity-30 dark:text-indigo-300'
            }`}>
              {article.category}
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{article.readTime}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <time dateTime={article.publishedDate}>
              {new Date(article.publishedDate).toLocaleDateString('en-GB', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
          </div>
        </header>

        {/* Article Content */}
        <article className="article-content max-w-none prose prose-slate">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            skipHtml
            components={{
              a: ({href = '', children, ...props}) => {
                const allowProtocols = (url) => /^(https?:|mailto:|tel:)/i.test(url);
                return (
                  <a
                    href={allowProtocols(href) ? href : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              // Block iframes/objects for security
              iframe: () => null,
              object: () => null,
              embed: () => null
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>

      </div>
    </div>
  );
};

export default Article;