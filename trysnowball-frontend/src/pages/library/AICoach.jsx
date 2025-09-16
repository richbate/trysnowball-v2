import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function AICoach() {
  return (
    <LibraryLayout>
      <Article title="How TrySnowball's AI Coach Helps You Get Out of Debt Faster" description="Private, personalised guidance that fits your numbers — with safety guardrails.">
        <h3>Personalised to your plan</h3>
        <p>The AI Coach isn't generic tips. It looks at <em>your</em> balances, rates, and payments, then suggests what to target, how much time you'll save adding £50/month, and what to do if your budget changes.</p>
        <h3>Available 24/7</h3>
        <p>Questions at 2am? Ask. Run what‑if scenarios instantly. No waiting for calls.</p>
        <h3>Privacy first</h3>
        <ul>
          <li>No bank connections required</li>
          <li>Your data stays in your browser</li>
          <li>All AI requests are encrypted</li>
          <li>You choose what the AI sees</li>
        </ul>
        <h3>Guardrails that keep it safe</h3>
        <ul>
          <li>Input validation and hard token caps</li>
          <li>Rate limits and cost controls</li>
          <li>Graceful fallbacks when AI is unavailable</li>
        </ul>
        <h3>Partner, not boss</h3>
        <p>We show the numbers and trade‑offs. You decide. Always.</p>
      </Article>
    </LibraryLayout>
  );
}