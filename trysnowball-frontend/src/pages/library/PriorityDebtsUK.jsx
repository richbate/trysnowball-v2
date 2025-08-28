import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function PriorityDebtsUK() {
  return (
    <LibraryLayout>
      <Article 
        title="Priority Debts in the UK: What to Pay First" 
        description="Some debts have serious consequences if missed. Keep these current before tackling credit cards or loans."
      >
        <p>
          Not all debts are equal. <strong>Priority debts</strong> can lead to court action, bailiffs, eviction or disconnection if ignored. 
          Always keep these current.
        </p>

        <h3>Priority debts (typical)</h3>
        <ul className="list-disc pl-5">
          <li>Rent or mortgage arrears</li>
          <li>Council tax arrears</li>
          <li>Gas/electricity arrears (risk of disconnection)</li>
          <li>Magistrates' court fines</li>
          <li>TV licence, Child maintenance, Income tax/VAT</li>
        </ul>

        <h3>Non-priority debts</h3>
        <p>Usually: credit cards, personal loans, store cards, BNPL, overdrafts.</p>

        <h3>What to do if you're behind</h3>
        <ul className="list-disc pl-5">
          <li>Contact the creditor/council immediately to agree a payment plan.</li>
          <li>Seek free, impartial help: StepChange or National Debtline.</li>
          <li>Consider "Breathing Space" (England & Wales) if you need time to stabilise.</li>
        </ul>

        <p className="mt-6">
          Learn about{" "}
          <a href="/library/breathing-space-uk" className="text-blue-600 hover:underline">Breathing Space</a>{" "}
          or return to{" "}
          <a href="/library/debt-snowball-plan" className="text-blue-600 hover:underline">Snowball strategy</a>.
        </p>
      </Article>
    </LibraryLayout>
  );
}