export interface ActionArticle {
 id: string;
 category: 'start' | 'spending' | 'motivation' | 'habits' | 'levelup';
 title: string;
 summary: string;
 steps: string[];
 link?: {
  label: string;
  href: string;
  type: 'internal' | 'external';
 };
 image?: string;
 featureTrigger?: 'openForecast' | 'openSnowflakeModal' | 'addExtraPayment' | 'openCoach' | 'openDebts';
 posthogEvent?: string;
}

export const actionArticles: ActionArticle[] = [
 // Get Started
 {
  id: 'open-snowball-pot',
  category: 'start',
  title: 'Open a Dedicated Snowball Pot',
  summary: 'Stop mixing debt payments with daily spending. A separate account = clarity.',
  steps: [
   'Open a free bank account (Monzo, Starling, Chase)',
   'Name it "Debt Destroyer" or "Freedom Fund"',
   'Set up a standing order from your main account',
   'Watch it grow. Feel the momentum.'
  ],
  link: {
   label: 'Compare Bank Accounts',
   href: 'https://www.moneysavingexpert.com/banking/compare-best-bank-accounts/',
   type: 'external'
  }
 },
 {
  id: 'first-snowflake',
  category: 'start',
  title: 'Make Your First Snowflake',
  summary: 'Even £5 extra matters. It\'s not the amount, it\'s the habit.',
  steps: [
   'Find any spare cash (skip a coffee, sell something)',
   'Add it as a Snowflake in the app',
   'See your timeline shift forward',
   'Repeat. Build momentum.'
  ],
  featureTrigger: 'openSnowflakeModal'
 },
 {
  id: 'check-credit-file',
  category: 'start',
  title: 'Check Your Credit File (Free)',
  summary: 'You can\'t fix what you don\'t know. Takes 5 minutes.',
  steps: [
   'Sign up to CheckMyFile (free trial)',
   'Check for errors or missed accounts',
   'Add any missing debts to Snowball',
   'Set a monthly reminder to check again'
  ],
  link: {
   label: 'Check with CheckMyFile',
   href: 'https://www.checkmyfile.com/',
   type: 'external'
  }
 },

 // Cut Spending
 {
  id: 'cancel-one-subscription',
  category: 'spending',
  title: 'Cancel One Subscription Today',
  summary: 'That gym you don\'t use? The app you forgot about? Kill it.',
  steps: [
   'Check your bank statement for recurring payments',
   'Pick the most useless one',
   'Cancel it right now (not tomorrow)',
   'Add the monthly saving as a recurring Snowflake'
  ],
  featureTrigger: 'openSnowflakeModal'
 },
 {
  id: 'snoop-your-spending',
  category: 'spending',
  title: 'Use Snoop to Spot Money Leaks',
  summary: 'AI-powered spending analysis. Free. Takes 2 minutes to set up.',
  steps: [
   'Download Snoop app (free)',
   'Connect your main bank account',
   'Review their "Bills" section for forgotten subscriptions',
   'Cancel at least 2 things you find'
  ],
  link: {
   label: 'Get Snoop',
   href: 'https://snoop.app/',
   type: 'external'
  }
 },
 {
  id: 'build-budget-sheet',
  category: 'spending',
  title: 'Build a Simple Budget Sheet',
  summary: 'No fancy apps. Just a spreadsheet. Control your money.',
  steps: [
   'Copy our Google Sheets template',
   'Add your income and fixed costs',
   'See what\'s left for debt payments',
   'Find 3 things to cut'
  ],
  link: {
   label: 'Money Helper: Budget Planner',
   href: 'https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner',
   type: 'external'
  }
 },

 // Boost Motivation
 {
  id: 'debt-thermometer',
  category: 'motivation',
  title: 'Create a Progress Tracker',
  summary: 'Visual motivation. Track any financial goal.',
  steps: [
   'Choose a financial goal (debt payoff, savings target)',
   'Draw or create a visual progress tracker',
   'Update it monthly as you make progress',
   'Put it somewhere you\'ll see daily'
  ]
 },
 {
  id: 'write-your-why',
  category: 'motivation',
  title: 'Write Your Debt-Free "Why"',
  summary: 'When it gets tough, you need to remember why you started.',
  steps: [
   'Grab a pen and paper (not your phone)',
   'Write "When I\'m debt-free, I will..."',
   'List 5 specific things (holidays, house deposit, freedom)',
   'Pin it next to your thermometer'
  ]
 },
 {
  id: 'share-milestone',
  category: 'motivation',
  title: 'Share a Milestone',
  summary: 'Accountability = Results. Tell someone about your progress.',
  steps: [
   'Hit a debt milestone in the app',
   'Share it with one friend or family member',
   'Ask them to check in monthly',
   'Celebrate small wins together'
  ],
  featureTrigger: 'openDebts'
 },

 // Build Habits
 {
  id: 'payday-calendar',
  category: 'habits',
  title: 'Add Payday to Your Calendar',
  summary: 'Make debt payments automatic. Same day, every month.',
  steps: [
   'Open your calendar app',
   'Add recurring event: "Debt Payment Day"',
   'Set reminder for day before',
   'Never miss a payment again'
  ]
 },
 {
  id: 'monthly-forecast-review',
  category: 'habits',
  title: 'Review Your Forecast Monthly',
  summary: 'Stay on track. Adjust as needed. Keep momentum.',
  steps: [
   'Set a monthly recurring reminder',
   'Open your Snowball forecast',
   'Check if you\'re ahead or behind',
   'Add any extra payments you can'
  ],
  featureTrigger: 'openForecast'
 },
 {
  id: 'no-spend-challenge',
  category: 'habits',
  title: 'Weekly "No Spend" Challenge',
  summary: 'One day a week. Zero spending. Watch the savings add up.',
  steps: [
   'Pick a day (Tuesdays work well)',
   'Commit to spending £0 that day',
   'Track your streak in the app',
   'Use saved money for extra debt payment'
  ]
 },

 // Level Up
 {
  id: 'import-history',
  category: 'levelup',
  title: 'Import Your Debt History',
  summary: 'You didn\'t start today. Import past balances to see your full journey.',
  steps: [
   'Go to My Plan → Debts tab',
   'Click the History icon on any debt',
   'Paste your monthly balances',
   'See your complete debt payoff story'
  ],
  featureTrigger: 'openDebts'
 },
 {
  id: 'avalanche-method',
  category: 'levelup',
  title: 'Switch to Avalanche Method',
  summary: 'Pay less interest overall. Math over emotion.',
  steps: [
   'List debts by interest rate (highest first)',
   'Pay minimums on all debts',
   'Attack highest rate debt with everything extra',
   'Save hundreds in interest'
  ],
  featureTrigger: 'openDebts'
 },
 {
  id: 'rent-credit-file',
  category: 'levelup',
  title: 'Add Rent to Your Credit File',
  summary: 'You pay it anyway. Make it count toward your credit score.',
  steps: [
   'Sign up to Canopy or CreditLadder',
   'Connect your rent payments',
   'Watch your credit score improve',
   'Get better rates on future loans'
  ],
  link: {
   label: 'Try Canopy',
   href: 'https://www.canopy.rent/',
   type: 'external'
  }
 },
 {
  id: 'side-hustle-pot',
  category: 'levelup',
  title: 'Create a Side Hustle Pot',
  summary: 'Extra income = faster freedom. Even £50/month helps.',
  steps: [
   'List 3 skills you could monetize',
   'Pick the easiest to start',
   'Set up a separate "hustle" account',
   'Put 100% toward debt (don\'t lifestyle creep)'
  ]
 }
];

export const categoryLabels = {
 start: '📍 Get Started',
 spending: '💸 Cut Spending',
 motivation: '🧠 Boost Motivation',
 habits: '🔁 Build Habits',
 levelup: '📈 Level Up'
};

export const categoryDescriptions = {
 start: 'First steps to take control',
 spending: 'Find money you didn\'t know you had',
 motivation: 'Stay focused when it gets tough',
 habits: 'Small actions, big results',
 levelup: 'Advanced tactics for pros'
};