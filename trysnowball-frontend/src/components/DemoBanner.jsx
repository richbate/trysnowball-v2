/**
 * Demo Mode Banner
 * Shows at top of app when in demo mode
 */

import { useDemoMode } from '../providers/DemoModeProvider';

export default function DemoBanner() {
  const { isDemo, exitDemo } = useDemoMode();
  
  if (!isDemo) return null;
  
  return (
    <div className="w-full bg-yellow-50 border-b border-yellow-300 text-sm px-4 py-2 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <span className="text-yellow-800">
          You're in <strong>Demo Mode</strong> — nothing you do is saved.
        </span>
      </div>
      <button 
        className="text-yellow-900 underline hover:no-underline font-medium"
        onClick={() => exitDemo('/plan/debts')}
      >
        Use my real data →
      </button>
    </div>
  );
}