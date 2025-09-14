/**
 * Unified Action → PostHog Event Mapping
 * 
 * Maps library actions to their completion tracking methods:
 * - posthog: Auto-complete based on PostHog events
 * - manual: Track when user clicks "Complete" 
 * - hybrid: Both PostHog detection + manual fallback
 */

export interface ActionEventConfig {
 triggerType: 'posthog' | 'manual' | 'hybrid';
 event?: string;
 match?: (eventData: any) => boolean;
 trackWhenClicked?: boolean;
 url?: string;
 description?: string;
}

export const actionEvents: Record<string, ActionEventConfig> = {
 // Get Started Actions
 'open-snowball-pot': {
  triggerType: 'posthog',
  event: 'feature_opened',
  match: (e) => e?.properties?.feature === 'snowball_pot',
  description: 'User opens dedicated debt tracking pot'
 },
 'first-snowflake': {
  triggerType: 'posthog', 
  event: 'snowflake_added',
  description: 'User adds their first extra payment'
 },
 'check-credit-file': {
  triggerType: 'manual',
  trackWhenClicked: true,
  url: 'https://www.checkmyfile.com/',
  description: 'User clicks to check credit file with CheckMyFile'
 },

 // Cut Spending Actions
 'cancel-one-subscription': {
  triggerType: 'manual',
  trackWhenClicked: true,
  description: 'User marks subscription as cancelled'
 },
 'snoop-your-spending': {
  triggerType: 'manual',
  trackWhenClicked: true,
  url: 'https://www.snoop.app/',
  description: 'User clicks Snoop link to analyze spending'
 },
 'build-budget-sheet': {
  triggerType: 'manual',
  trackWhenClicked: true,
  url: 'https://www.moneyhelper.org.uk/en/everyday-money/budgeting/budget-planner',
  description: 'User opens Money Helper budget planner'
 },

 // Motivation Actions
 'debt-thermometer': {
  triggerType: 'manual',
  trackWhenClicked: true,
  description: 'User creates a visual progress tracker'
 },
 'share-milestone': {
  triggerType: 'posthog',
  event: 'milestone_shared',
  description: 'User shares a debt milestone'
 },
 'write-your-why': {
  triggerType: 'hybrid',
  event: 'debt_why_saved',
  trackWhenClicked: true,
  description: 'User saves their debt-free motivation'
 },

 // Build Habits Actions 
 'payday-calendar': {
  triggerType: 'manual',
  trackWhenClicked: true,
  description: 'User adds payday reminder to calendar'
 },
 'monthly-forecast-review': {
  triggerType: 'posthog',
  event: 'forecast_viewed',
  description: 'User views debt payoff forecast'
 },
 'no-spend-challenge': {
  triggerType: 'manual',
  trackWhenClicked: true,
  description: 'User commits to no-spend challenge'
 },

 // Level Up Actions
 'avalanche-method': {
  triggerType: 'posthog',
  event: 'strategy_changed_to_avalanche',
  description: 'User switches to avalanche strategy'
 },
 'rent-credit-file': {
  triggerType: 'manual',
  trackWhenClicked: true,
  url: 'https://www.canopy.rent/',
  description: 'User clicks Canopy rent reporting service'
 },
 // 'import-history': {
 //  triggerType: 'posthog',
 //  event: 'snapshots_imported',
 //  description: 'User imports historical debt balances'
 // },
 'side-hustle-pot': {
  triggerType: 'hybrid',
  event: 'side_hustle_pot_created',
  trackWhenClicked: true,
  description: 'User creates dedicated side hustle savings pot'
 }
};

/**
 * PostHog Event Schema for Action Tracking
 */
export const ACTION_EVENTS = {
 // Core action events
 ACTION_VIEWED: 'action_viewed',
 ACTION_STARTED: 'action_started', 
 ACTION_COMPLETED: 'action_completed',
 ACTION_CLICKED: 'action_clicked',
 
 // Feature usage events (trigger auto-completion)
 FEATURE_OPENED: 'feature_opened',
 SNOWFLAKE_ADDED: 'snowflake_added',
 MILESTONE_SHARED: 'milestone_shared',
 FORECAST_VIEWED: 'forecast_viewed',
 STRATEGY_CHANGED_TO_AVALANCHE: 'strategy_changed_to_avalanche',
 SNAPSHOTS_IMPORTED: 'snapshots_imported',
 DEBT_ADDED: 'debt_added',
 
 // Manual completion events
 DEBT_WHY_SAVED: 'debt_why_saved',
 SIDE_HUSTLE_POT_CREATED: 'side_hustle_pot_created'
} as const;

/**
 * Standard properties for action events
 */
export interface ActionEventProperties {
 actionId: string;
 actionCategory: 'start' | 'spending' | 'motivation' | 'habits' | 'levelup';
 actionTitle: string;
 source: 'action_card' | 'article_view' | 'modal' | 'cta';
 user_initiated: boolean;
 demo_mode?: boolean;
}

/**
 * Helper to track action completion
 */
export const trackActionEvent = (
 eventName: string, 
 actionId: string, 
 extraProps: Record<string, any> = {}
) => {
 const baseProps: ActionEventProperties = {
  actionId,
  actionCategory: getActionCategory(actionId),
  actionTitle: getActionTitle(actionId),
  source: 'action_card',
  user_initiated: true,
  ...extraProps
 };

 if (typeof window !== 'undefined' && (window as any).posthog) {
  (window as any).posthog.capture(eventName, baseProps);
 }
};

// Helper functions
const getActionCategory = (actionId: string): ActionEventProperties['actionCategory'] => {
 if (['open-snowball-pot', 'first-snowflake', 'check-credit-file'].includes(actionId)) return 'start';
 if (['cancel-one-subscription', 'snoop-your-spending', 'build-budget-sheet'].includes(actionId)) return 'spending';
 if (['debt-thermometer', 'share-milestone', 'write-your-why'].includes(actionId)) return 'motivation';
 if (['payday-calendar', 'monthly-forecast-review', 'no-spend-challenge'].includes(actionId)) return 'habits';
 return 'levelup';
};

const getActionTitle = (actionId: string): string => {
 // Import from library content for titles
 const titleMap: Record<string, string> = {
  'open-snowball-pot': 'Open a Dedicated Snowball Pot',
  'first-snowflake': 'Make Your First Snowflake',
  'check-credit-file': 'Check Your Credit File',
  'cancel-one-subscription': 'Cancel One Subscription',
  'snoop-your-spending': 'Use Snoop to Spot Money Leaks',
  'build-budget-sheet': 'Build a Budget Sheet',
  'debt-thermometer': 'Print Debt Thermometer',
  'share-milestone': 'Share a Milestone',
  'write-your-why': 'Write Your Debt-Free Why',
  'payday-calendar': 'Add Payday to Calendar',
  'monthly-forecast-review': 'Review Your Monthly Forecast',
  'no-spend-challenge': 'Try a No-Spend Challenge',
  'avalanche-method': 'Switch to Avalanche Method',
  'rent-credit-file': 'Add Rent to Credit File',
  'import-history': 'Import Your Debt History',
  'side-hustle-pot': 'Create Side Hustle Pot'
 };
 return titleMap[actionId] || actionId;
};