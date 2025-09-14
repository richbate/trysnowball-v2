import React, { useState, useMemo } from 'react';
import { Search, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';
import LibraryCard from '../components/library/LibraryCard';
import { actionArticles, categoryLabels, categoryDescriptions } from '../data/libraryContent';
import useActionProgress from '../hooks/useActionProgress';
import { useUserDebts } from '../hooks/useUserDebts';

const LibraryPage = () => {
 const navigate = useNavigate();
 const posthog = usePostHog();
 const [selectedCategory, setSelectedCategory] = useState('all');
 const [searchQuery, setSearchQuery] = useState('');
 const { completed, isAutoCompleted, trackFeatureUse, trackAction, completeAction } = useActionProgress();
 const [saved, setSaved] = useState([]);
 
 // Manual save/unsave for bookmarking
 const toggleSave = (actionId) => {
  setSaved(prev => 
   prev.includes(actionId) 
    ? prev.filter(id => id !== actionId)
    : [...prev, actionId]
  );
 };
 const { debts } = useUserDebts();

 const handleTriggerFeature = (trigger) => {
  switch (trigger) {
   case 'openSnowflakeModal':
    // Navigate to snowflakes tab in Plan workspace
    navigate('/plan/snowflakes');
    break;
   case 'openForecast':
    trackFeatureUse('forecast');
    navigate('/plan/forecast');
    break;
   case 'openDebts':
    navigate('/plan/debts');
    break;
   case 'openCoach':
    navigate('/coach');
    break;
   case 'addExtraPayment':
    if (debts && debts.length > 0) {
     navigate('/my-plan?tab=strategy');
    }
    break;
   default:
    console.log('Unknown feature trigger:', trigger);
  }
 };

 const filteredArticles = useMemo(() => {
  let articles = actionArticles;
  
  if (selectedCategory !== 'all') {
   articles = articles.filter(a => a.category === selectedCategory);
  }
  
  if (searchQuery) {
   const query = searchQuery.toLowerCase();
   articles = articles.filter(a => 
    a.title.toLowerCase().includes(query) ||
    a.summary.toLowerCase().includes(query) ||
    a.steps.some(s => s.toLowerCase().includes(query))
   );
  }
  
  return articles;
 }, [selectedCategory, searchQuery]);

 const getNextBestAction = () => {
  const notDone = actionArticles.filter(a => !completed.includes(a.id));
  const startActions = notDone.filter(a => a.category === 'start');
  if (startActions.length > 0) return startActions[0];
  
  const spendingActions = notDone.filter(a => a.category === 'spending');
  if (spendingActions.length > 0) return spendingActions[0];
  
  return notDone[0];
 };

 const nextAction = getNextBestAction();
 const completedCount = completed.length;
 const totalCount = actionArticles.length;
 const completionPercentage = Math.round((completedCount / totalCount) * 100);

 return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
   <div className="mb-8">
    <h1 className="text-3xl font-bold text-text mb-2">
     Action Hub
    </h1>
    <p className="text-muted">
     Small wins. Big results. Pick an action and get it done.
    </p>
   </div>

   {/* Progress Bar */}
   <div className="bg-surface rounded-lg p-4 mb-6 shadow-sm border border-border">
    <div className="flex items-center justify-between mb-2">
     <span className="text-sm font-medium text-text">
      Your Progress
     </span>
     <span className="text-sm text-muted">
      {completedCount} of {totalCount} actions completed
     </span>
    </div>
    <div className="w-full bg-bg rounded-full h-2">
     <div 
      className="bg-success h-2 rounded-full transition-all duration-300"
      style={{ width: `${completionPercentage}%` }}
     />
    </div>
   </div>

   {/* Next Best Action */}
   {nextAction && !searchQuery && selectedCategory === 'all' && (
    <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-lg p-6 mb-6 border border-primary/30">
     <div className="flex items-start gap-3">
      <div className="flex-shrink-0">
       <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
       </div>
      </div>
      <div className="flex-1">
       <h2 className="text-lg font-semibold text-text mb-1">
        Next Best Action
       </h2>
       <p className="text-text font-medium mb-2">
        {nextAction.title}
       </p>
       <p className="text-sm text-muted mb-3">
        {nextAction.summary}
       </p>
       <button
        onClick={() => navigate(`/library/${nextAction.id}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent"
       >
        Start Now
        <TrendingUp size={16} />
       </button>
      </div>
     </div>
    </div>
   )}

   {/* Search and Filter */}
   <div className="flex flex-col sm:flex-row gap-4 mb-6">
    <div className="flex-1 relative">
     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
     <input
      type="text"
      placeholder="Search actions..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-surface text-text focus:ring-2 focus:ring-primary focus:border-transparent"
     />
    </div>
    
    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
     <button
      onClick={() => setSelectedCategory('all')}
      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
       selectedCategory === 'all'
        ? 'bg-primary text-white'
        : 'bg-bg text-text hover:bg-border'
      }`}
     >
      All Actions
     </button>
     {Object.keys(categoryLabels).map(category => (
      <button
       key={category}
       onClick={() => setSelectedCategory(category)}
       className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
        selectedCategory === category
         ? 'bg-primary text-white'
         : 'bg-bg text-text hover:bg-border'
       }`}
      >
       {categoryLabels[category]}
      </button>
     ))}
    </div>
   </div>

   {/* Category Description */}
   {selectedCategory !== 'all' && (
    <div className="mb-6 p-4 bg-bg rounded-lg">
     <p className="text-sm text-muted">
      {categoryDescriptions[selectedCategory]}
     </p>
    </div>
   )}

   {/* Quick Stats */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
     <div className="text-2xl font-bold text-success">
      {completedCount}
     </div>
     <div className="text-xs text-muted">Completed</div>
    </div>
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
     <div className="text-2xl font-bold text-yellow-600">
      {saved.length}
     </div>
     <div className="text-xs text-muted">Saved</div>
    </div>
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
     <div className="text-2xl font-bold text-primary">
      {totalCount - completedCount}
     </div>
     <div className="text-xs text-muted">To Do</div>
    </div>
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
     <div className="text-2xl font-bold text-purple-600">
      {completionPercentage}%
     </div>
     <div className="text-xs text-muted">Progress</div>
    </div>
   </div>

   {/* Action Cards Grid */}
   {filteredArticles.length > 0 ? (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
     {filteredArticles.map(article => (
      <LibraryCard
       key={article.id}
       article={article}
       isDone={completed.includes(article.id)}
       isSaved={saved.includes(article.id)}
       isAutoCompleted={isAutoCompleted(article.id)}
       onToggleSave={toggleSave}
       onOpenArticle={(id) => {
        trackAction('viewed', id, { source: 'action_card' });
        navigate(`/library/${id}`);
       }}
       onTriggerFeature={handleTriggerFeature}
       onTrackAction={trackAction}
       onCompleteAction={completeAction}
      />
     ))}
    </div>
   ) : (
    <div className="text-center py-12">
     <p className="text-muted">
      No actions found matching your search.
     </p>
    </div>
   )}
  </div>
 );
};

export default LibraryPage;