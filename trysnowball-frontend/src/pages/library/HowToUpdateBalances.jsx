import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function HowToUpdateBalances() {
  return (
    <LibraryLayout>
      <Article 
        title="How to Update Balances in TrySnowball" 
        description="Keep your plan accurate in three quick steps."
      >
        <h3>Steps</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Open each lender app or latest statement.</li>
          <li>Enter the current balance and minimum payment in TrySnowball.</li>
          <li>Save and check your new projected debt-free date.</li>
        </ol>
        <p className="mt-4">
          Do this weekly — it keeps you honest and shows real progress. 
          Then ask{" "}
          <a href="/ai/coach" className="text-blue-600 hover:underline">Yuki</a> to suggest your next target.
        </p>
      </Article>
    </LibraryLayout>
  );
}