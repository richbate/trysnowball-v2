/**
 * Dynamic Share Message Generation
 * Creates personalized share content for different milestones
 */

/**
 * Generate dynamic share data for milestones
 * @param {Object} milestone - Milestone data
 * @param {Object} user - User data
 * @param {string} referralLink - User's referral link
 * @returns {Object} Share data with title, description, and hashtags
 */
export const generateMilestoneShareData = (milestone, user, referralLink) => {
  const userName = user?.email?.split('@')[0] || 'Someone';
  
  const shareData = {
    url: referralLink,
    hashtags: ['DebtFree', 'TrySnowball'],
    imageUrl: `https://trysnowball.co.uk/og-milestone.png` // Default for now
  };

  switch (milestone?.type) {
    case 'debt_cleared':
      shareData.title = `🎉 I just cleared my ${milestone.debtName || 'debt'}!`;
      shareData.description = `${userName} just paid off their debt with TrySnowball! Join the debt-free movement.`;
      shareData.hashtags.push('DebtCleared', 'PaidOff');
      break;
      
    case 'milestone_hit':
      shareData.title = `🎯 Major milestone achieved - ${milestone.message?.replace('🎯 ', '') || 'debt progress made'}!`;
      shareData.description = `The snowball method really works! Watch ${userName}'s progress with TrySnowball.`;
      shareData.hashtags.push('DebtProgress', 'Milestone');
      break;
      
    case 'all_debts_cleared':
      shareData.title = `🎊 DEBT FREE! I just made my final payment!`;
      shareData.description = `${userName} is officially debt-free! TrySnowball helped plan every step of the journey.`;
      shareData.hashtags.push('DebtFreedom', 'FinancialFreedom');
      break;
      
    default:
      shareData.title = `💪 Making progress on my debt freedom journey!`;
      shareData.description = `${userName} is crushing debt with TrySnowball. Join the movement!`;
      shareData.hashtags.push('DebtJourney');
  }

  return shareData;
};

/**
 * Generate share data for general debt progress
 * @param {Array} debts - User's debts
 * @param {Object} user - User data
 * @param {string} referralLink - User's referral link
 * @returns {Object} Share data
 */
export const generateDebtProgressShareData = (debts, user, referralLink) => {
  const userName = user?.email?.split('@')[0] || 'Someone';
  const totalDebt = debts.reduce((sum, debt) => sum + (debt.balance || debt.amount || 0), 0);
  const debtCount = debts.length;

  return {
    url: referralLink,
    title: `💪 I've added my ${debtCount} debt${debtCount !== 1 ? 's' : ''} to TrySnowball and I'm ready to become debt-free!`,
    description: `${userName} is taking control of £${totalDebt.toLocaleString()} in debt with TrySnowball. Start your debt freedom journey today!`,
    hashtags: ['DebtFree', 'TrySnowball', 'DebtJourney'],
    imageUrl: `https://trysnowball.co.uk/og-progress.png`
  };
};

/**
 * Create platform-specific share URLs with better formatting
 * @param {Object} shareData - Share data object
 * @returns {Object} Platform-specific formatted data
 */
export const formatShareDataForPlatforms = (shareData) => {
  return {
    twitter: {
      ...shareData,
      title: shareData.title + '\n\n' + shareData.description
    },
    facebook: {
      ...shareData,
      quote: shareData.title + ' ' + shareData.description
    },
    linkedin: {
      ...shareData,
      title: shareData.title,
      summary: shareData.description,
      source: 'TrySnowball'
    },
    whatsapp: {
      ...shareData,
      title: shareData.title + '\n\n' + shareData.description + '\n\n' + shareData.url
    }
  };
};