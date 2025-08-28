import React from 'react';

export default function ImpactHeadline({ impact, basePayoffMonths, strategyPayoffMonths }) {
  const months = Math.max(0, Math.round(impact?.monthsSaved || 0));
  const interest = Math.max(0, Math.round((impact?.interestSaved || 0)));
  
  // Calculate projected dates
  const getProjectedDate = (monthsFromNow) => {
    if (!monthsFromNow || monthsFromNow <= 0) return null;
    const date = new Date();
    date.setMonth(date.getMonth() + monthsFromNow);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  };

  const baseDate = getProjectedDate(basePayoffMonths);
  const strategyDate = getProjectedDate(strategyPayoffMonths);
  
  return (
    <div className="h-full rounded-2xl border bg-white p-4 flex flex-col" data-testid="impact-headline">
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Your Results</div>
        
        {/* Main headline */}
        <div className="text-2xl font-bold">
          {months > 0 ? (
            <span className="text-green-700">🎉 Debt-free {months} months sooner</span>
          ) : (
            <span className="text-gray-700">Keep going to see time saved</span>
          )}
        </div>
        
        {/* Compressed date format */}
        {baseDate && strategyDate && months > 0 && (
          <div className="text-sm text-gray-600">
            Debt-free by <span className="font-semibold text-green-700">{strategyDate}</span> (was {baseDate})
          </div>
        )}
        
        {/* Tighter interest savings copy */}
        <div className="text-sm text-gray-600">
          {interest > 0 ? (
            <>≈ <span className="font-semibold text-green-700">£{interest.toLocaleString()}</span> less interest</>
          ) : (
            'Add more to see your savings'
          )}
        </div>
      </div>

    </div>
  );
}