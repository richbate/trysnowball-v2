import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActionArticle from './ActionArticle';
import useLibraryProgress from '../../hooks/useLibraryProgress';
import { useUserDebts } from '../../hooks/useUserDebts';

const ActionArticleWrapper = () => {
 const navigate = useNavigate();
 const { done, saved, markDone, toggleSave } = useLibraryProgress();
 const { debts } = useUserDebts();

 const handleTriggerFeature = (trigger) => {
  switch (trigger) {
   case 'openSnowflakeModal':
    // Navigate to snowflakes tab in Plan workspace
    navigate('/plan/snowflakes');
    break;
   case 'openForecast':
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
     navigate('/plan/strategy');
    }
    break;
   default:
    console.log('Unknown feature trigger:', trigger);
  }
 };

 return (
  <ActionArticle
   onMarkDone={markDone}
   onToggleSave={toggleSave}
   isDone={(articleId) => done.includes(articleId)}
   isSaved={(articleId) => saved.includes(articleId)}
   onTriggerFeature={handleTriggerFeature}
  />
 );
};

export default ActionArticleWrapper;