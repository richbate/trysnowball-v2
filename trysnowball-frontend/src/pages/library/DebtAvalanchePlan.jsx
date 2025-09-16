import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function DebtAvalanchePlan() {
  return (
    <LibraryLayout>
      <Article 
        title="The Debt Avalanche Plan: Pay Less Interest" 
        description="Target the highest interest rates first to reduce the total cost of your debt repayments."
      >
        <p>
          The <strong>Debt Avalanche</strong> focuses on cost. You sort debts by <em>highest interest rate</em> and kill the most expensive first. 
          This usually saves the most money overall.
        </p>

        <h3>How it works (5 steps)</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>List debts from <em>highest APR/EAR</em> to lowest.</li>
          <li>Pay at least the minimum on all debts.</li>
          <li>Throw all extra money at the highest-rate debt.</li>
          <li>When it's gone, roll that payment into the next highest rate.</li>
          <li>Repeat until you're debt-free.</li>
        </ol>

        <h3>UK example</h3>
        <ul className="list-disc pl-5">
          <li>£1,000 credit card @ 24% APR</li>
          <li>£2,000 overdraft @ 19% EAR</li>
          <li>£4,000 loan @ 6% APR</li>
        </ul>
        <p>
          You'd clear the 24% card first, then the overdraft, then the loan. This order reduces total interest paid.
        </p>

        <h3>Pros & Cons</h3>
        <ul className="list-disc pl-5">
          <li><strong>Pros:</strong> Lowest total interest, faster overall in pure maths.</li>
          <li><strong>Cons:</strong> Early wins may be slower; some people lose motivation.</li>
        </ul>

        <h3>Pick what you'll stick to</h3>
        <p>
          Avalanche wins on cost; Snowball often wins on behaviour. Try both in TrySnowball and choose the one you'll follow.
        </p>

        <p className="mt-6">
          Compare with the{" "}
          <a href="/library/debt-snowball-plan" className="text-blue-600 hover:underline">Debt Snowball plan</a>{" "}
          or read the{" "}
          <a href="/library/debt-snowball-vs-avalanche" className="text-blue-600 hover:underline">full comparison</a>.
        </p>
      </Article>
    </LibraryLayout>
  );
}