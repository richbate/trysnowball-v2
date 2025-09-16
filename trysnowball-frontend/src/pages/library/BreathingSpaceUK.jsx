import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function BreathingSpaceUK() {
  return (
    <LibraryLayout>
      <Article 
        title="Breathing Space (England & Wales): How It Works" 
        description="Temporary legal protection from most creditor action while you get debt advice and stabilise your finances."
      >
        <p>
          <strong>Breathing Space</strong> gives you time to get advice and organise a plan. 
          During the period, most interest/fees are paused and most enforcement is stopped.
        </p>

        <h3>Types</h3>
        <ul className="list-disc pl-5">
          <li><strong>Standard Breathing Space:</strong> Usually 60 days.</li>
          <li><strong>Mental Health Crisis Breathing Space:</strong> Lasts while treatment continues, plus 30 days.</li>
        </ul>

        <h3>Key points</h3>
        <ul className="list-disc pl-5">
          <li>You must apply via a debt adviser (e.g. StepChange, National Debtline).</li>
          <li>You still need to keep paying priority bills if you can.</li>
          <li>Use the time to set up a realistic budget and repayment plan.</li>
        </ul>

        <h3>Is it right for me?</h3>
        <p>
          Helpful if you're overwhelmed by arrears or enforcement letters and need immediate breathing room. 
          Not a solution on its own — it's a pause to build your plan.
        </p>

        <p className="mt-6">
          Next: see{" "}
          <a href="/library/priority-debts-uk" className="text-blue-600 hover:underline">Priority Debts</a>{" "}
          and{" "}
          <a href="/ai/coach" className="text-blue-600 hover:underline">ask Yuki</a>{" "}
          for a stabilisation checklist tailored to your debts.
        </p>
      </Article>
    </LibraryLayout>
  );
}