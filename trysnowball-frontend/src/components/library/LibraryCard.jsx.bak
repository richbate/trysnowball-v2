import React from 'react';
import { CheckCircle, Bookmark, ExternalLink, ChevronRight } from 'lucide-react';
import { categoryLabels } from '../../data/libraryContent';
import { actionEvents } from '../../data/actionEventsMap';

const LibraryCard = ({ 
 article, 
 isDone, 
 isSaved,
 isAutoCompleted = false,
 onToggleSave, 
 onOpenArticle,
 onTriggerFeature,
 onTrackAction,
 onCompleteAction
}) => {
 // Get action configuration
 const actionConfig = actionEvents[article.id];
 
 const handleAction = () => {
  // Track action start
  onTrackAction?.('started', article.id, { source: 'action_card' });

  if (article.featureTrigger) {
   onTriggerFeature(article.featureTrigger);
  } else if (article.link?.type === 'external' || actionConfig?.url) {
   // Track external link click
   if (actionConfig?.trackWhenClicked) {
    onTrackAction?.('clicked', article.id, { 
     url: actionConfig.url || article.link.href,
     external: true
    });
    // Auto-complete manual actions when clicked
    if (actionConfig.triggerType === 'manual') {
     onCompleteAction?.(article.id);
    }
   }
   
   const url = actionConfig?.url || article.link.href;
   window.open(url, '_blank');
  } else {
   onOpenArticle(article.id);
  }
 };

 const handleCompleteAction = () => {
  onCompleteAction?.(article.id);
 };

 const getCategoryColor = (category) => {
  const colors = {
   start: 'bg-primary/10 text-primary',
   spending: 'bg-success/10 text-success',
   motivation: 'bg-purple-100 text-purple-800',
   habits: 'bg-orange-100 text-orange-800',
   levelup: 'bg-danger/10 text-danger'
  };
  return colors[category] || 'bg-bg text-text';
 };

 return (
  <div className={`
   bg-surface rounded-lg shadow-sm border 
   ${isDone ? 'border-success/50 opacity-75' : 'border-border'}
   hover:shadow-md transition-all duration-200
  `}>
   <div className="p-5">
    <div className="flex items-start justify-between mb-3">
     <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
      {categoryLabels[article.category]}
     </span>
     <div className="flex gap-2">
      <button
       onClick={(e) => {
        e.stopPropagation();
        onToggleSave(article.id);
       }}
       className="text-muted hover:text-yellow-500 transition-colors"
       aria-label={isSaved ? 'Remove from saved' : 'Save for later'}
      >
       <Bookmark 
        size={18} 
        className={isSaved ? 'fill-yellow-500 text-yellow-500' : ''}
       />
      </button>
      {isDone && (
       <div className="flex items-center gap-1">
        <CheckCircle size={18} className="text-success" />
        {isAutoCompleted && (
         <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
          Auto
         </span>
        )}
       </div>
      )}
     </div>
    </div>

    <h3 className="text-lg font-semibold text-text mb-2">
     {article.title}
    </h3>
    
    <p className="text-sm text-muted mb-4 line-clamp-2">
     {article.summary}
    </p>

    <div className="flex items-center justify-between">
     <button
      onClick={handleAction}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent"
     >
      {actionConfig?.url || article.link?.type === 'external' ? (
       actionConfig?.triggerType === 'manual' ? 'Start Action' : 'Learn More'
      ) : article.featureTrigger ? 'Open Feature' : 'View Steps'}
      {actionConfig?.url || article.link?.type === 'external' ? 
       <ExternalLink size={14} /> : 
       <ChevronRight size={14} />
      }
     </button>

     {/* Show manual complete button for non-auto actions when not done */}
     {!isDone && actionConfig?.triggerType === 'manual' && !actionConfig?.url && (
      <button
       onClick={handleCompleteAction}
       className="text-xs text-muted hover:text-success transition-colors"
      >
       Mark as done
      </button>
     )}
     
     {/* Show hybrid actions complete button when not auto-completed */}
     {!isDone && actionConfig?.triggerType === 'hybrid' && !isAutoCompleted && (
      <button
       onClick={handleCompleteAction}
       className="text-xs text-muted hover:text-success transition-colors"
      >
       Mark as done
      </button>
     )}
    </div>
   </div>
  </div>
 );
};

export default LibraryCard;