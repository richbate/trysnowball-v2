import React from 'react';
import CommitmentGenerator from '../../components/CommitmentGenerator';

const GoalsTab = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Monthly Commitment Goals</h2>
        <p className="text-slate-600">
          Get AI-generated monthly goals to stay motivated on your debt freedom journey
        </p>
      </div>
      
      <CommitmentGenerator className="max-w-4xl mx-auto" />
    </div>
  );
};

export default GoalsTab;