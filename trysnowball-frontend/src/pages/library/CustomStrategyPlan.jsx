import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function CustomStrategyPlan() {
  return (
    <LibraryLayout>
      <Article 
        title="Design Your Own Debt Strategy (Hybrid)" 
        description="Blend Snowball and Avalanche to match your mindset, cash flow, and risk tolerance."
      >
        <p>
          You don't have to pick one camp. Many people do best with a <strong>hybrid plan</strong>: quick wins first, then lowest-cost repayments.
        </p>

        <h3>3 simple templates</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Kickstart:</strong> Clear the smallest 1–2 balances (Snowball), then switch to Avalanche.</li>
          <li><strong>APR Guard:</strong> Always attack any debt over a chosen APR (e.g. 25%) first.</li>
          <li><strong>Cash-Flow First:</strong> Prioritise the debt whose removal frees the most monthly cash.</li>
        </ol>

        <h3>Rules that always apply (UK)</h3>
        <ul className="list-disc pl-5">
          <li><strong>Keep priority debts current</strong> (rent/mortgage arrears, council tax, energy, magistrates' fines).</li>
          <li>Make at least the minimum on all non-priority debts to avoid penalties.</li>
          <li>Automate payments where possible to reduce missed months.</li>
        </ul>

        <h3>Make it yours</h3>
        <p>
          In TrySnowball, update balances and ask{" "}
          <a href="/ai/coach" className="text-blue-600 hover:underline">Yuki</a>:
          <em> "Build me a hybrid plan: two Snowball wins, then Avalanche."</em>
        </p>

        <p className="mt-6">
          Related reads:{" "}
          <a href="/library/debt-snowball-plan" className="text-blue-600 hover:underline">Snowball</a>{" "}
          ·{" "}
          <a href="/library/debt-avalanche-plan" className="text-blue-600 hover:underline">Avalanche</a>
        </p>
      </Article>
    </LibraryLayout>
  );
}