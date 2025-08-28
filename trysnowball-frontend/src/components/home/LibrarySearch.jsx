import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Search } from 'lucide-react';
import { analytics } from '../../lib/posthog';

const LibrarySearch = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      analytics.track('home_search', {
        query: query.trim(),
        timestamp: new Date().toISOString()
      });
      navigate(`/library?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className={`${colors.surface} rounded-2xl border ${colors.border} shadow-sm p-6 mb-8`}>
      <h2 className={`text-xl font-bold ${colors.text.primary} mb-4`}>
        Search Our Library
      </h2>
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for guides, articles, and resources..."
          className={`w-full pl-12 pr-4 py-3 ${colors.surface} border ${colors.border} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${colors.text.primary}`}
        />
        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${colors.text.secondary}`} />
        <button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Search
        </button>
      </form>
      <p className={`text-sm ${colors.text.secondary} mt-3`}>
        Find articles on debt strategies, budgeting tips, and financial planning
      </p>
    </div>
  );
};

export default LibrarySearch;