import React from 'react';
import LibraryLayout from './LibraryLayout';
import Article from './components/Article';

export default function CashbackRewardsGuide() {
 return (
  <LibraryLayout>
   <Article 
    title="Earn Free Money: Cashback & Rewards" 
    description="Get paid for things you're already buying. Cashback sites and reward platforms can add hundreds to your annual debt payments."
    readTime="10 minutes"
    category="Lower Your Costs"
   >
    <div className="space-y-6">
     <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">🧠 Why It Matters</h3>
      <p>
       Cashback sites and reward platforms let you earn real money for things you're already doing — switching broadband, 
       paying for insurance, or even just opening a new bank account.
      </p>
      <p className="mt-2">
       You won't get rich, but used well, this can cover bills or knock hundreds off your annual spend.
      </p>
     </div>

     <div>
      <h3 className="text-xl font-semibold mb-3">💡 What to Know</h3>
      <ul className="list-disc pl-6 space-y-2">
       <li>
        <strong>Quidco</strong> and <strong>TopCashback</strong> are the two biggest cashback sites in the UK.
       </li>
       <li>
        <strong>MoneySavingExpert</strong> regularly highlights the best cashback deals — including switching energy providers, 
        changing mobile contracts, or opening a new bank account.
       </li>
       <li>
        Most rewards are:
        <ul className="list-disc pl-6 mt-1 space-y-1 text-sm">
         <li>Paid via bank transfer or PayPal</li>
         <li>Triggered only if you click through from the cashback site</li>
         <li>Subject to tracking and confirmation periods (1–3 months typical)</li>
        </ul>
       </li>
      </ul>
     </div>

     <div>
      <h3 className="text-xl font-semibold mb-3">✅ What to Do</h3>
      
      <div className="space-y-6">
       <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold mb-2">Step 1: Sign up to a cashback site</h4>
        <ul className="space-y-1">
         <li>
          • Join <a href="https://www.quidco.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Quidco</a>
         </li>
         <li>
          • Join <a href="https://www.topcashback.co.uk" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">TopCashback</a>
         </li>
        </ul>
        <p className="mt-2 text-sm text-gray-600">
         Make sure to use a referral link to get a signup bonus (often £5–£10).
        </p>
       </div>

       <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold mb-2">Step 2: Always check before buying</h4>
        <p>
         Before you buy anything online — from broadband to insurance — check both cashback sites to see who pays more.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mt-3">
         <p className="font-semibold mb-2">📌 Example:</p>
         <ul className="space-y-1 text-sm">
          <li>• Switch to OVO Energy → £40 cashback</li>
          <li>• Take out pet insurance → £30 cashback</li>
          <li>• Open a Chase UK bank account → up to £20 via MSE or TopCashback</li>
         </ul>
        </div>
       </div>

       <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold mb-2">Step 3: Stack with deals from MSE</h4>
        <p className="mb-2">
         Check the Money Saving Expert cashback pages for:
        </p>
        <ul className="space-y-1">
         <li>• New account switch bonuses (bank, broadband, mobile)</li>
         <li>• Enhanced cashback boosts</li>
         <li>• Verified retailers & payout info</li>
        </ul>
        <p className="mt-3">
         👉 <a href="https://www.moneysavingexpert.com/deals/cashback-websites/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
          MSE Cashback Offers
         </a>
        </p>
       </div>

       <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-semibold mb-2">Step 4: Track your rewards</h4>
        <ul className="space-y-1">
         <li>• Add a calendar reminder to check if cashback has tracked</li>
         <li>• Withdraw to PayPal/bank once cleared</li>
         <li>• Optional: Set a goal in TrySnowball for "Cashback Rewards" to see progress</li>
        </ul>
       </div>
      </div>
     </div>

     <div className="bg-yellow-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">💬 Pro Tip</h3>
      <p className="font-semibold">
       Never rely on cashback guaranteeing a good deal.
      </p>
      <p className="mt-2">
       Always compare prices directly — sometimes cashback offers are tied to higher base rates.
      </p>
     </div>

     <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-2">🧊 How This Helps Your Snowball</h3>
      <p>
       <strong>Cashback = free extra payments toward your debts.</strong>
      </p>
      <p className="mt-2">
       Even a few one-off switches could mean £100+ extra toward your snowball this year.
      </p>
     </div>

     <div className="mt-8 p-4 bg-gray-100 rounded-lg">
      <p className="text-sm text-center">
       Ready to add your cashback earnings to your debt plan? 
       {" "}
       <a href="/my-plan" className="text-blue-600 hover:underline font-semibold">
        Track your progress in TrySnowball →
       </a>
      </p>
     </div>
    </div>
   </Article>
  </LibraryLayout>
 );
}