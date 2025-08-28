import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function PayOff5000() {
  return (
    <LibraryLayout>
      <Article title="How to Pay Off £5,000 of Credit Card Debt Fast in the UK" description="A practical, no‑guilt plan you can start today.">
        <h3>Step 1: Know your rate</h3>
        <p>At ~20% APR, a £5,000 balance racks up ~£1,000 interest a year if you only pay the minimum. Knowing the APR sets urgency.</p>
        <h3>Step 2: Pick your strategy</h3>
        <ul>
          <li><strong>Snowball</strong> for momentum</li>
          <li><strong>Avalanche</strong> for lowest cost</li>
          <li>TrySnowball shows both timelines instantly</li>
        </ul>
        <h3>Step 3: Add extra payments</h3>
        <p>Even £25–£50/month extra can cut months off your timeline. Automate it if you can.</p>
        <h3>Step 4: Avoid new debt</h3>
        <p>Freeze spending on the card until it's cleared. Remove it from your wallet and apps.</p>
        <p>Ready to get started? <a href="/how-it-works" className="text-blue-600 hover:underline">TrySnowball shows you exactly when you'll be debt-free</a>. Or check if you're making any of these <a href="/library/five-debt-mistakes" className="text-blue-600 hover:underline">5 common debt mistakes</a>.</p>
      </Article>
    </LibraryLayout>
  );
}