/**
 * Smart Onboarding Configuration
 * Two-part survey that actually leads somewhere useful
 */

export const ONBOARDING_QUESTIONS = {
 motivation: {
  id: 'motivation',
  title: "What's your goal with TrySnowball?",
  subtitle: "We'll personalize your experience based on what matters most to you",
  type: 'single', // or 'ranked' if we want priority order
  options: [
   {
    id: 'fast',
    label: 'Get out of debt as fast as possible',
    icon: '🚀',
    description: 'I want the quickest route to £0'
   },
   {
    id: 'interest',
    label: 'Stop paying so much in interest',
    icon: '💸',
    description: 'The monthly charges are killing me'
   },
   {
    id: 'motivation',
    label: 'Stay motivated and on track',
    icon: '💪',
    description: 'I start strong but lose momentum'
   },
   {
    id: 'independence',
    label: 'Stop relying on credit',
    icon: '🔓',
    description: 'I want financial independence'
   },
   {
    id: 'plan',
    label: 'Get a plan I can actually stick to',
    icon: '📋',
    description: 'I need structure and clarity'
   },
   {
    id: 'understanding',
    label: 'Understand what\'s happening with my money',
    icon: '🧠',
    description: 'I feel lost and need clarity'
   }
  ]
 },
 
 situation: {
  id: 'situation',
  title: "What's your debt situation like?",
  subtitle: "This helps us recommend the right starting point",
  type: 'single',
  options: [
   {
    id: 'simple',
    label: 'Just a few credit cards',
    icon: '💳',
    description: '2-3 cards, manageable but annoying'
   },
   {
    id: 'mixed',
    label: 'Juggling multiple debts',
    icon: '🤹',
    description: 'Cards, loans, overdrafts - the works'
   },
   {
    id: 'overwhelmed',
    label: 'Drowning - struggling to keep up',
    icon: '🆘',
    description: 'Missed payments, stress, need help now'
   },
   {
    id: 'unknown',
    label: 'Not sure - need to figure it out',
    icon: '❓',
    description: 'Haven\'t added it all up yet'
   }
  ]
 }
};

/**
 * Next Step Recommendations
 * Based on motivation + situation combo
 */
export const NEXT_STEPS = {
 // Fast payoff goals
 'fast_simple': {
  title: 'Start with the Debt Snowball',
  description: 'Pay minimums on everything, then attack your smallest debt first. Quick wins build momentum.',
  cta: 'Set Up Snowball Strategy',
  route: '/library/debt-snowball-plan',
  metrics: { strategy: 'snowball', reason: 'quick_wins' }
 },
 'fast_mixed': {
  title: 'Organize, then Snowball',
  description: 'List all your debts, then knock them out smallest to largest. Momentum beats math.',
  cta: 'Import & Organize Debts',
  route: '/plan/debts',
  metrics: { strategy: 'snowball', reason: 'needs_organization' }
 },
 'fast_overwhelmed': {
  title: 'Emergency Mode: Minimum Payments First',
  description: 'Stabilize by covering minimums, then focus on the smallest debt for a quick win.',
  cta: 'Set Up Emergency Plan',
  route: '/library/priority-debts-uk',
  metrics: { strategy: 'emergency', reason: 'crisis_mode' }
 },
 
 // Interest savings goals
 'interest_simple': {
  title: 'Try the Debt Avalanche',
  description: 'Attack your highest APR debt first. Mathematically optimal for saving money.',
  cta: 'Set Up Avalanche Strategy',
  route: '/library/debt-avalanche-plan',
  metrics: { strategy: 'avalanche', reason: 'optimize_interest' }
 },
 'interest_mixed': {
  title: 'Avalanche + Balance Transfer',
  description: 'Target high-APR debts first, and consider moving balances to 0% cards.',
  cta: 'Explore Interest Strategies',
  route: '/library/debt-avalanche-plan',
  metrics: { strategy: 'avalanche', reason: 'complex_optimization' }
 },
 'interest_overwhelmed': {
  title: 'Breathing Space Might Help',
  description: 'UK residents can freeze interest for 60 days. Get breathing room, then optimize.',
  cta: 'Learn About Breathing Space',
  route: '/library/breathing-space-uk',
  metrics: { strategy: 'breathing_space', reason: 'interest_freeze' }
 },
 
 // Motivation goals
 'motivation_simple': {
  title: '30-Day Small Debt Challenge',
  description: 'Pick your smallest debt and obliterate it in 30 days. Feel the win.',
  cta: 'Start 30-Day Challenge',
  route: '/library/small-debt-challenge',
  metrics: { strategy: 'challenge', reason: 'quick_motivation' }
 },
 'motivation_mixed': {
  title: 'Visual Progress Tracking',
  description: 'See your timeline, celebrate milestones, share wins. Progress you can see.',
  cta: 'View Your Timeline',
  route: '/plan/timeline',
  metrics: { strategy: 'visual', reason: 'progress_tracking' }
 },
 'motivation_overwhelmed': {
  title: 'One Win at a Time',
  description: 'Forget the big picture. Pick ONE debt under £500 and kill it.',
  cta: 'Find Your First Win',
  route: '/plan/debts',
  metrics: { strategy: 'micro_wins', reason: 'overwhelm_reduction' }
 },
 
 // Understanding goals
 'understanding_simple': {
  title: 'See Your Debt Timeline',
  description: 'Import your debts and see exactly when you\'ll be free. Knowledge is power.',
  cta: 'Build Your Timeline',
  route: '/plan/debts',
  metrics: { strategy: 'education', reason: 'timeline_clarity' }
 },
 'understanding_mixed': {
  title: 'Debt Strategy Comparison',
  description: 'See how Snowball vs Avalanche affects your payoff date and interest.',
  cta: 'Compare Strategies',
  route: '/library/debt-snowball-vs-avalanche',
  metrics: { strategy: 'education', reason: 'strategy_comparison' }
 },
 'understanding_overwhelmed': {
  title: 'Start with the Basics',
  description: 'List everything you owe. No judgment, just clarity. One step at a time.',
  cta: 'List Your Debts',
  route: '/plan/debts',
  metrics: { strategy: 'education', reason: 'basic_clarity' }
 },
 'understanding_unknown': {
  title: 'Debt Discovery Mode',
  description: 'Let\'s figure out what you\'re dealing with. Import or add debts to see the full picture.',
  cta: 'Start Debt Discovery',
  route: '/plan/debts',
  metrics: { strategy: 'discovery', reason: 'unknown_state' }
 },
 
 // Plan/structure goals
 'plan_simple': {
  title: 'Your Personalized Payoff Plan',
  description: 'Based on your debts, here\'s a month-by-month plan you can follow.',
  cta: 'Generate My Plan',
  route: '/plan/strategy',
  metrics: { strategy: 'structured', reason: 'simple_plan' }
 },
 'plan_mixed': {
  title: 'Custom Strategy Builder',
  description: 'Mix snowball and avalanche. Set your own rules. Make it work for YOU.',
  cta: 'Build Custom Strategy',
  route: '/library/custom-strategy-plan',
  metrics: { strategy: 'custom', reason: 'flexibility_needed' }
 },
 'plan_overwhelmed': {
  title: 'Week-by-Week Recovery Plan',
  description: 'Forget months. Let\'s plan the next 4 weeks. Small steps, clear actions.',
  cta: 'Create Weekly Plan',
  route: '/plan/strategy',
  metrics: { strategy: 'micro_planning', reason: 'overwhelm_structure' }
 },
 
 // Independence goals
 'independence_simple': {
  title: 'Break the Credit Cycle',
  description: 'Build an emergency fund while paying debts. Never need credit again.',
  cta: 'Start Independence Plan',
  route: '/library/emergency-fund-guide',
  metrics: { strategy: 'independence', reason: 'break_cycle' }
 },
 'independence_mixed': {
  title: 'Debt-Free Living Blueprint',
  description: 'Pay off debts AND build habits that keep you free forever.',
  cta: 'Get the Blueprint',
  route: '/library/debt-free-blueprint',
  metrics: { strategy: 'lifestyle', reason: 'permanent_change' }
 },
 'independence_overwhelmed': {
  title: 'Survival First, Freedom Second',
  description: 'Stabilize your situation, then build toward never needing credit again.',
  cta: 'Start Survival Mode',
  route: '/library/priority-debts-uk',
  metrics: { strategy: 'stabilize', reason: 'crisis_to_freedom' }
 },
 
 // Default fallbacks
 'default': {
  title: 'Start with Your Debt List',
  description: 'Add your debts to see your timeline and explore strategies.',
  cta: 'Add Your Debts',
  route: '/plan/debts',
  metrics: { strategy: 'default', reason: 'no_match' }
 }
};

/**
 * Get recommended next step based on user's answers
 */
export function getNextStep(motivation, situation) {
 const key = `${motivation}_${situation}`;
 return NEXT_STEPS[key] || NEXT_STEPS.default;
}

/**
 * Store user's onboarding preferences
 */
export function saveOnboardingProfile(profile) {
 localStorage.setItem('onboarding_profile', JSON.stringify({
  ...profile,
  completed_at: new Date().toISOString()
 }));
 
 // Track with PostHog
 if (window.posthog) {
  window.posthog.capture('onboarding_complete', profile);
  window.posthog.people.set({
   goal_motivation: profile.motivation,
   debt_situation: profile.situation
  });
 }
}

/**
 * Get user's onboarding profile
 */
export function getOnboardingProfile() {
 try {
  return JSON.parse(localStorage.getItem('onboarding_profile') || '{}');
 } catch {
  return {};
 }
}

/**
 * Check if user needs onboarding
 */
export function needsOnboarding() {
 const profile = getOnboardingProfile();
 return !profile.completed_at;
}