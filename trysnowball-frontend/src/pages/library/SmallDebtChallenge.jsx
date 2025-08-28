import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function SmallDebtChallenge() {
  return (
    <LibraryLayout>
      <Article 
        title="30-Day Small Debt Challenge" 
        description="Pick one balance under £500 and clear it in a month. Fast win, instant momentum."
      >
        <p>
          Momentum beats perfection. This month, clear <strong>one small balance (≤ £500)</strong>. 
          You'll feel the win and free up cash for the next target.
        </p>

        <h3>Plan (four weeks)</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Week 1:</strong> Pick the debt. Cut £5–£10/day from non-essentials.</li>
          <li><strong>Week 2:</strong> Sell 2–3 items you don't use. Add the cash.</li>
          <li><strong>Week 3:</strong> Call the creditor; ask about interest freeze or payment plan.</li>
          <li><strong>Week 4:</strong> Throw all extra at the target. Celebrate, then roll payment forward.</li>
        </ol>

        <h3>Tips</h3>
        <ul className="list-disc pl-5">
          <li>Make it visible — sticky note on your laptop: "£<em>balance</em> → £0".</li>
          <li>Automate weekly transfers to avoid skipping days.</li>
          <li>Share the win — keep yourself accountable.</li>
        </ul>

        <p className="mt-6">
          Next: switch to{" "}
          <a href="/library/debt-snowball-plan" className="text-blue-600 hover:underline">Snowball</a>{" "}
          or{" "}
          <a href="/library/debt-avalanche-plan" className="text-blue-600 hover:underline">Avalanche</a>{" "}
          for the rest.
        </p>
      </Article>
    </LibraryLayout>
  );
}