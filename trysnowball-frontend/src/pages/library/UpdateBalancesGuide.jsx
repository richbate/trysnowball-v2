import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function UpdateBalancesGuide() {
  return (
    <LibraryLayout>
      <Article 
        title="How to Update Your Balances (Properly)" 
        description="Five minutes a week keeps your plan honest, your projections accurate, and your motivation high."
      >
        <p>
          Accurate balances = accurate plan. A quick weekly check-in stops drift and shows real progress.
        </p>

        <h3>Weekly update checklist (5 minutes)</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Open your lender apps/statements.</li>
          <li>Enter current balances in TrySnowball.</li>
          <li>Record any payments made this week.</li>
          <li>Note changes to minimum payments or APRs.</li>
          <li>Glance at your payoff date — celebrate movement.</li>
        </ol>

        <h3>Tips</h3>
        <ul className="list-disc pl-5">
          <li>Set a calendar reminder (same time every week).</li>
          <li>Round to the nearest pound — speed beats perfection.</li>
          <li>Log one win you're proud of; keep momentum visible.</li>
        </ul>

        <p className="mt-6">
          Next: try the{" "}
          <a href="/library/small-debt-challenge" className="text-blue-600 hover:underline">30-Day Small Debt Challenge</a>{" "}
          to build momentum.
        </p>
      </Article>
    </LibraryLayout>
  );
}