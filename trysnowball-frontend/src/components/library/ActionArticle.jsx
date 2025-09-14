import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Circle, ExternalLink, Bookmark, Share2 } from 'lucide-react';
import { actionArticles, categoryLabels } from '../../data/libraryContent';
import { useNavigate, useParams } from 'react-router-dom';
import { usePostHog } from 'posthog-js/react';

const ActionArticle = ({ 
 onMarkDone, 
 onToggleSave, 
 isDone, 
 isSaved,
 onTriggerFeature 
}) => {
 const { articleId } = useParams();
 const navigate = useNavigate();
 const posthog = usePostHog();
 const [completedSteps, setCompletedSteps] = useState([]);
 const [showShareToast, setShowShareToast] = useState(false);
 
 const article = actionArticles.find(a => a.id === articleId);

 useEffect(() => {
  if (article) {
   posthog?.capture('library_viewed', { 
    article_id: article.id,
    category: article.category 
   });
  }
 }, [article, posthog]);

 if (!article) {
  return (
   <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="text-center">
     <p className="text-gray-500 mb-4">Article not found</p>
     <button
      onClick={() => navigate('/library')}
      className="text-blue-600 hover:underline"
     >
      Back to Actions
     </button>
    </div>
   </div>
  );
 }

 const toggleStep = (index) => {
  setCompletedSteps(prev => 
   prev.includes(index) 
    ? prev.filter(i => i !== index)
    : [...prev, index]
  );
 };

 const handleShare = async () => {
  const shareData = {
   title: article.title,
   text: article.summary,
   url: window.location.href
  };

  try {
   if (navigator.share) {
    await navigator.share(shareData);
   } else {
    await navigator.clipboard.writeText(window.location.href);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3000);
   }
  } catch (err) {
   console.log('Error sharing:', err);
  }
 };

 const handleActionClick = () => {
  if (article.featureTrigger) {
   posthog?.capture('library_feature_used', { trigger: article.featureTrigger });
   onTriggerFeature(article.featureTrigger);
  } else if (article.link) {
   posthog?.capture('library_launch_link', { 
    article_id: article.id,
    link_type: article.link.type 
   });
   if (article.link.type === 'external') {
    window.open(article.link.href, '_blank');
   } else {
    navigate(article.link.href);
   }
  }
 };

 const getCategoryColor = (category) => {
  const colors = {
   start: 'bg-blue-100 text-blue-800 ',
   spending: 'bg-green-100 text-green-800 ',
   motivation: 'bg-purple-100 text-purple-800 ',
   habits: 'bg-orange-100 text-orange-800 ',
   levelup: 'bg-red-100 text-red-800 '
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
 };

 const allStepsComplete = completedSteps.length === article.steps.length;

 return (
  <div className="max-w-3xl mx-auto px-4 py-8">
   <button
    onClick={() => navigate('/library')}
    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
   >
    <ArrowLeft size={20} />
    Back to Actions
   </button>

   <div className="bg-white rounded-lg shadow-sm border border-gray-200 ">
    <div className="p-6 sm:p-8">
     <div className="flex items-start justify-between mb-4">
      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
       {categoryLabels[article.category]}
      </span>
      <div className="flex gap-2">
       <button
        onClick={() => onToggleSave(article.id)}
        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
        aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
       >
        <Bookmark 
         size={20} 
         className={isSaved ? 'fill-yellow-500 text-yellow-500' : ''}
        />
       </button>
       <button
        onClick={handleShare}
        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
        aria-label="Share article"
       >
        <Share2 size={20} />
       </button>
      </div>
     </div>

     <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
      {article.title}
     </h1>

     <p className="text-lg text-gray-600 mb-8">
      {article.summary}
     </p>

     <div className="space-y-4 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 ">
       Steps to Take
      </h2>
      {article.steps.map((step, index) => (
       <div
        key={index}
        className="flex items-start gap-3 cursor-pointer group"
        onClick={() => toggleStep(index)}
       >
        <button className="mt-0.5 flex-shrink-0">
         {completedSteps.includes(index) ? (
          <CheckCircle size={20} className="text-green-500" />
         ) : (
          <Circle size={20} className="text-gray-400 group-hover:text-gray-600 " />
         )}
        </button>
        <p className={`text-gray-700 ${
         completedSteps.includes(index) ? 'line-through opacity-60' : ''
        }`}>
         {step}
        </p>
       </div>
      ))}
     </div>

     {(article.link || article.featureTrigger) && (
      <div className="border-t border-gray-200 pt-6">
       <button
        onClick={handleActionClick}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
       >
        {article.link?.label || 'Open Feature'}
        {article.link?.type === 'external' && <ExternalLink size={16} />}
       </button>
      </div>
     )}

     <div className="border-t border-gray-200 pt-6 mt-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
       {!isDone ? (
        <button
         onClick={() => {
          onMarkDone(article.id);
          posthog?.capture('library_mark_done', { 
           article_id: article.id,
           category: article.category 
          });
         }}
         disabled={!allStepsComplete}
         className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          allStepsComplete
           ? 'bg-green-600 text-white hover:bg-green-700'
           : 'bg-gray-200 text-gray-400 cursor-not-allowed'
         }`}
        >
         <CheckCircle size={18} />
         Mark as Complete
        </button>
       ) : (
        <div className="inline-flex items-center gap-2 text-green-600 ">
         <CheckCircle size={20} />
         <span className="font-medium">Completed</span>
        </div>
       )}
       
       {!allStepsComplete && !isDone && (
        <p className="text-sm text-gray-500 ">
         Complete all steps to mark this action as done
        </p>
       )}
      </div>
     </div>
    </div>
   </div>

   {showShareToast && (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg">
     Link copied to clipboard!
    </div>
   )}
  </div>
 );
};

export default ActionArticle;