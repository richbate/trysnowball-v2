import React from 'react';

const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse">
      {/* Header skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="skeleton h-8 w-64 mb-2 rounded"></div>
              <div className="skeleton h-5 w-96 mb-1 rounded"></div>
              <div className="skeleton h-4 w-48 rounded"></div>
            </div>
            <div className="skeleton h-16 w-16 rounded-lg"></div>
          </div>
        </div>

        {/* Tab navigation skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-8">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 px-6 py-4">
                <div className="skeleton h-6 w-20 rounded mx-auto"></div>
              </div>
            ))}
          </div>
          
          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            <div className="skeleton h-6 w-full rounded"></div>
            <div className="skeleton h-4 w-3/4 rounded"></div>
            <div className="skeleton h-4 w-1/2 rounded"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-lg"></div>
              ))}
            </div>
            
            <div className="skeleton h-64 w-full rounded-lg mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;