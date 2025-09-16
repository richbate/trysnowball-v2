/**
 * Hook for managing debt milestone detection and sharing
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { detectMilestone, trackReferralEvent } from '../utils/referralUtils';
import { debtAnalytics } from '../lib/posthog';

export const useMilestoneSharing = (debts) => {
  const { user } = useUser();
  const [currentMilestone, setCurrentMilestone] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [previousDebts, setPreviousDebts] = useState([]);

  // Track debt changes and detect milestones
  useEffect(() => {
    if (!debts || debts.length === 0) {
      setPreviousDebts([]);
      return;
    }

    // Only check for milestones if we have previous debt state
    if (previousDebts.length > 0) {
      const milestone = detectMilestone(debts, previousDebts);
      
      if (milestone) {
        console.log('[Milestone] Detected:', milestone);
        setCurrentMilestone(milestone);
        setShowShareModal(true);
        
        // Track milestone achievement
        trackReferralEvent('milestone_achieved', {
          type: milestone.type,
          debtName: milestone.debtName,
          amount: milestone.amount,
          userId: user?.id
        });
        
        // Track in PostHog
        debtAnalytics.trackMilestone(milestone.type, {
          name: milestone.debtName,
          amount: milestone.amount,
          shared: false // Will be updated when actually shared
        });
      }
    }

    // Update previous debts for next comparison
    setPreviousDebts(JSON.parse(JSON.stringify(debts)));
  }, [debts, user]); // Removed previousDebts from deps to prevent infinite loop

  // Manually trigger milestone sharing (for GPT-detected milestones or testing)
  const triggerMilestoneShare = useCallback((milestone) => {
    setCurrentMilestone(milestone);
    setShowShareModal(true);
    
    trackReferralEvent('milestone_manual_trigger', {
      type: milestone.type,
      source: 'manual'
    });
  }, []);

  // Close sharing modal
  const closeSharingModal = useCallback(() => {
    setShowShareModal(false);
    setCurrentMilestone(null);
    
    trackReferralEvent('share_modal_closed', {
      milestoneType: currentMilestone?.type
    });
  }, [currentMilestone]);

  // Test milestone for development
  const testMilestone = useCallback((type = 'debt_cleared') => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const testMilestones = {
      debt_cleared: {
        type: 'debt_cleared',
        debtName: 'Test Credit Card',
        amount: 2500,
        message: '🎉 I just cleared my Test Credit Card!'
      },
      milestone_hit: {
        type: 'milestone_hit',
        threshold: 10000,
        currentDebt: 9850,
        message: '🎯 Just broke through the £10k barrier!'
      },
      all_debts_cleared: {
        type: 'all_debts_cleared',
        message: '🎊 DEBT FREE! I just paid off my last debt!'
      }
    };
    
    triggerMilestoneShare(testMilestones[type]);
  }, [triggerMilestoneShare]);

  return {
    currentMilestone,
    showShareModal,
    closeSharingModal,
    triggerMilestoneShare,
    testMilestone // Development only
  };
};