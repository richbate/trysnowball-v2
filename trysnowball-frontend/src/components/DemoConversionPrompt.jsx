/**
 * Demo Conversion Prompt
 * Shows at milestone moments to convert demo users
 */

import { useDemoMode, getDemoMeta } from '../providers/DemoModeProvider';
import { useTheme } from '../contexts/ThemeContext';

export default function DemoConversionPrompt({ context = {}, trigger = 'milestone' }) {
  const { isDemo, exitDemo } = useDemoMode();
  const { colors } = useTheme();
  const { demo_mode } = getDemoMeta();
  
  if (!demo_mode) return null;
  
  const messages = {
    milestone: "You're crushing it! Ready to do this with your real debts?",
    payoff: "Nice work! See how fast you could pay off YOUR actual debts",
    strategy: "Great strategy! Apply this to your real financial situation",
    default: "Like what you see? Try this with your real data"
  };
  
  // Use context headline if provided
  const headline = context.headline || messages[trigger] || messages.default;
  
  const handleConvert = () => {
    // Track conversion attempt with enhanced context
    if (window.posthog) {
      window.posthog.capture('demo_conversion_attempt', {
        demo_mode: true,
        trigger,
        context: context.type || 'unknown', 
        milestone: context.milestone || 'unknown',
        from_page: window.location.pathname
      });
    }
    
    // Exit demo and go to debt entry
    exitDemo('/debts');
  };
  
  return (
    <div className={`rounded-lg border ${colors.border} ${colors.surfaceSecondary} p-4 mt-4`}>
      <div className="flex items-start space-x-3">
        <span className="text-2xl">🚀</span>
        <div className="flex-1">
          <p className={`${colors.text.primary} font-medium mb-2`}>
            {headline}
          </p>
          <button
            onClick={handleConvert}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Use My Real Data →
          </button>
        </div>
      </div>
    </div>
  );
}