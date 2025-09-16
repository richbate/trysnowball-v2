import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function FiveDebtMistakes() {
  return (
    <LibraryLayout>
      <Article 
        title="5 Debt Mistakes That Slow You Down" 
        description="Avoid these common traps and you'll shave months off your payoff timeline."
      >
        <p>Quick wins come from avoiding obvious errors. Here are five to skip:</p>

        <h3>1) Ignoring priority debts</h3>
        <p>
          Council tax, rent/mortgage, energy, magistrates' fines — these have serious consequences. Keep them current first.
        </p>

        <h3>2) Only paying minimums forever</h3>
        <p>
          Minimums keep accounts open but rarely move the needle. Add any extra to a target debt every month.
        </p>

        <h3>3) Not updating balances</h3>
        <p>
          Out-of-date numbers = bad decisions. Do a 5-minute weekly update.
        </p>

        <h3>4) Borrowing to cover basics</h3>
        <p>
          If you're using credit for essentials, pause and rebuild the budget. Consider Breathing Space for short-term relief.
        </p>

        <h3>5) Chasing too many goals</h3>
        <p>
          Focus on one target debt at a time. Finish it, then roll the payment forward.
        </p>

        <p className="mt-6">
          Get a tailored plan — ask{" "}
          <a href="/ai/coach" className="text-blue-600 hover:underline">Yuki</a>:
          <em> "Show me the fastest way to clear my debts from these balances."</em>
        </p>
      </Article>
    </LibraryLayout>
  );
}