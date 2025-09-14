import React from 'react';
import { ChevronRight, TrendingUp, AlertCircle, Lightbulb, Trophy, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { track } from '../lib/analytics';

const InsightBox = ({ insight, onDismiss }) => {
 const navigate = useNavigate();
 
 const getIcon = () => {
  switch (insight.type) {
   case 'interest_warning':
    return <AlertCircle className="w-5 h-5" />;
   case 'payment_progress':
    return <TrendingUp className="w-5 h-5" />;
   case 'spending_alert':
    return <CreditCard className="w-5 h-5" />;
   case 'opportunity':
    return <Lightbulb className="w-5 h-5" />;
   case 'achievement':
    return <Trophy className="w-5 h-5" />;
   default:
    return <TrendingUp className="w-5 h-5" />;
  }
 };
 
 const getColorClasses = () => {
  switch (insight.type) {
   case 'interest_warning':
    return 'bg-red-50 border-red-200 text-red-900';
   case 'spending_alert':
    return 'bg-orange-50 border-orange-200 text-orange-900';
   case 'opportunity':
    return 'bg-blue-50 border-blue-200 text-blue-900';
   case 'achievement':
    return 'bg-green-50 border-green-200 text-green-900';
   default:
    return 'bg-gray-50 border-gray-200 text-gray-900';
  }
 };
 
 const getIconColorClasses = () => {
  switch (insight.type) {
   case 'interest_warning':
    return 'text-red-600 bg-red-100';
   case 'spending_alert':
    return 'text-orange-600 bg-orange-100';
   case 'opportunity':
    return 'text-blue-600 bg-blue-100';
   case 'achievement':
    return 'text-green-600 bg-green-100';
   default:
    return 'text-gray-600 bg-gray-100';
  }
 };
 
 const handleCTA = () => {
  if (insight.cta?.action) {
   track('insight_cta_clicked', {
    insight_id: insight.id,
    insight_type: insight.type,
    cta_label: insight.cta.label,
    cta_action: insight.cta.action
   });
   
   if (insight.cta.action.startsWith('navigate:')) {
    const path = insight.cta.action.replace('navigate:', '');
    navigate(path);
   } else {
    // Handle other action types in the future
    console.log('CTA action:', insight.cta.action);
   }
  }
 };
 
 return (
  <div className={`rounded-lg border p-4 ${getColorClasses()} transition-all hover:shadow-md`}>
   <div className="flex items-start space-x-3">
    <div className={`p-2 rounded-lg flex-shrink-0 ${getIconColorClasses()}`}>
     {insight.icon ? (
      <span className="text-lg">{insight.icon}</span>
     ) : (
      getIcon()
     )}
    </div>
    
    <div className="flex-1 min-w-0">
     <h3 className="font-semibold text-sm mb-1">
      {insight.title}
     </h3>
     <p className="text-sm opacity-90">
      {insight.body}
     </p>
     
     {insight.cta && (
      <button
       onClick={handleCTA}
       className="mt-2 inline-flex items-center text-sm font-medium hover:underline"
      >
       {insight.cta.label}
       <ChevronRight className="w-4 h-4 ml-1" />
      </button>
     )}
    </div>
    
    {onDismiss && (
     <button
      onClick={() => {
       track('insight_dismissed', {
        insight_id: insight.id,
        insight_type: insight.type
       });
       onDismiss(insight.id);
      }}
      className="text-gray-400 hover:text-gray-600 p-1"
      aria-label="Dismiss insight"
     >
      ×
     </button>
    )}
   </div>
  </div>
 );
};

export default InsightBox;