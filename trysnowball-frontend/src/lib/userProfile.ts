export type DebtFocus = 'payoff_faster' | 'stop_paycheck' | 'get_organized';
export type JourneyStage = 'starter' | 'progress' | 'optimizer';

export type UserProfile = {
  debtFocus?: DebtFocus[];      // multi-select from 3 cards
  journeyStage?: JourneyStage;  // single choice
  updatedAt?: string;           // ISO
};

const KEY = 'SNOWBALL_USER_PROFILE';

export function loadUserProfile(): UserProfile {
  try { 
    return JSON.parse(localStorage.getItem(KEY) || '{}'); 
  } catch { 
    return {}; 
  }
}

export function saveUserProfile(p: Partial<UserProfile>): UserProfile {
  const curr = loadUserProfile();
  const next: UserProfile = { ...curr, ...p, updatedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}