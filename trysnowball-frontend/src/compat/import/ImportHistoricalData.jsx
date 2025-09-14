import React from 'react';
import LibraryLayout from '../../pages/library/LibraryLayout';
import Article from '../../pages/library/components/Article';

export default function ImportHistoricalData() {
 return (
  <LibraryLayout>
   <Article 
    title="Import Your Debt History: Give Yourself Credit for Progress Already Made" 
    description="You didn't start today. Import your historical balances and see your complete debt-crushing journey."
   >
    <h3>You've Already Been Working on This</h3>
    <p>
     If you've been tracking your debts for months (or years), you deserve to see that progress reflected in your timeline. 
     Starting from just today's balance ignores all the hard work you've already put in.
    </p>
    <p>
     That's why TrySnowball lets you import historical balance data — so you can see the <em>full</em> picture of your debt payoff journey, 
     not just what happens from today forward.
    </p>

    <h3>Manual Entry Only</h3>
    <p>
     <strong>Note:</strong> The import functionality has been temporarily disabled. 
     You can add your debts manually using the "Add Debt" button on the Debts tab.
    </p>
    {/* <h3>How to Import Your Balance History</h3>
    <ol>
     <li>Go to <strong>My Plan → Debts tab</strong></li>
     <li>Click the <strong>History icon</strong> (clock symbol) next to any debt</li>
     <li>Paste your historical balances in a simple format</li>
     <li>Click <strong>Preview Import</strong> to check the data</li>
     <li>Click <strong>Import</strong> to add your history</li>
    </ol> */}

    {/* <h3>What Format Should I Use?</h3>
    <p>Keep it simple. Each line should have a date and balance, separated by a comma:</p>
    <pre className="bg-gray-100 p-3 rounded text-sm">
{`June 2024,2200
July 2024,2100
August 2024,1950
September 2024,1800
October 2024,1650
November 2024,1500`}
    </pre>
    
    <p className="text-sm text-gray-600 mt-2">
     💡 <strong>Tip:</strong> The importer is flexible. It handles various date formats (Jun 2024, 06/2024, 2024-06-01) 
     and automatically strips currency symbols (£, $).
    </p>

    <h3>Where Do I Find My Historical Balances?</h3>
    <ul>
     <li><strong>Bank statements:</strong> Download PDFs or CSVs from your online banking</li>
     <li><strong>Credit card statements:</strong> Check the "statement balance" each month</li>
     <li><strong>Spreadsheets:</strong> If you've been tracking manually, copy the data</li>
     <li><strong>Banking apps:</strong> Many show balance history in the account details</li>
     <li><strong>Old screenshots:</strong> Check your photos for statement screenshots</li>
    </ul>

    <h3>What If I Don't Have Exact Balances?</h3>
    <p>
     Don't worry. Even rough estimates (e.g. "£2100ish in June") are better than nothing. 
     Your progress will still feel more grounded and motivating than starting from just today.
    </p>
    <p>
     Most people begin with today's numbers — and that's totally fine. 
     But if you've already been chipping away at your debts, adding a bit of history helps tell the whole story.
    </p> */}

    <h3>Why Import Historical Data?</h3>
    <div className="space-y-3">
     <div className="flex items-start gap-3">
      <span className="text-2xl">📈</span>
      <div>
       <strong>See Your Real Progress</strong>
       <p className="text-sm text-gray-600 ">
        Your timeline shows the complete journey, not just future projections
       </p>
      </div>
     </div>
     
     <div className="flex items-start gap-3">
      <span className="text-2xl">🎯</span>
      <div>
       <strong>More Accurate Projections</strong>
       <p className="text-sm text-gray-600 ">
        Historical payment patterns help predict your actual payoff date
       </p>
      </div>
     </div>
     
     <div className="flex items-start gap-3">
      <span className="text-2xl">💪</span>
      <div>
       <strong>Motivation from Past Wins</strong>
       <p className="text-sm text-gray-600 ">
        Seeing how far you've come makes the rest feel achievable
       </p>
      </div>
     </div>
     
     <div className="flex items-start gap-3">
      <span className="text-2xl">📊</span>
      <div>
       <strong>Track Seasonal Patterns</strong>
       <p className="text-sm text-gray-600 ">
        Identify when you make bigger payments (bonuses, tax refunds, etc.)
       </p>
      </div>
     </div>
    </div>

    <h3>Pro Tips for Best Results</h3>
    <ul>
     <li><strong>Start with your highest-interest debt:</strong> This often has the most impact on your timeline</li>
     <li><strong>Go back 6-12 months:</strong> This gives enough data to show real trends</li>
     <li><strong>Use statement dates:</strong> End-of-month balances are most consistent</li>
     <li><strong>Don't stress perfection:</strong> Close-enough data is infinitely better than no data</li>
    </ul>

    <h3>What Happens to My Imported Data?</h3>
    <p>
     Your historical snapshots are stored locally in your browser (IndexedDB). They're treated as "adjustment" 
     points in your debt timeline, helping create a more complete picture of your payoff journey.
    </p>
    <p className="text-sm text-gray-600 ">
     <strong>Privacy note:</strong> Your balance history never leaves your device unless you explicitly 
     choose to sync with cloud storage.
    </p>

    <h3>Give Yourself Credit</h3>
    <p className="font-medium">
     Every payment you've made counts. Every balance that's dropped is progress. 
     Import your history and see the full story of your debt-free journey — because you didn't start today, 
     and you deserve credit for every step you've already taken.
    </p>
   </Article>
  </LibraryLayout>
 );
}