/**
 * GPT prompts for milestone detection and share message generation
 */

/**
 * System prompt for GPT to detect milestone achievements from user messages
 */
export const MILESTONE_DETECTION_PROMPT = `
You are a milestone detection system for TrySnowball, a debt freedom application.

Your role is to:
1. Analyze user messages for debt milestones and achievements
2. Extract key details about what they accomplished
3. Return structured data about their milestone

MILESTONE TYPES TO DETECT:
- "debt_cleared": User paid off a specific debt completely
- "milestone_hit": User crossed a major debt threshold (£10k, £5k, £1k)
- "all_debts_cleared": User became completely debt-free
- "progress_update": Significant progress but no major milestone

EXAMPLE USER INPUTS:
- "I just paid off my Halifax overdraft!"
- "MBNA is finally gone - £3,200 paid off!"
- "Broke through £10k barrier today"
- "I'm officially debt free!"

RESPONSE FORMAT (JSON only):
{
  "milestone_detected": true/false,
  "type": "debt_cleared|milestone_hit|all_debts_cleared|progress_update",
  "debt_name": "extracted debt name if applicable",
  "amount": estimated_amount_if_mentioned,
  "confidence": 0.8,
  "celebration_message": "🎉 I just cleared my Halifax overdraft!",
  "share_worthy": true/false
}

RULES:
- Only detect clear, definitive achievements
- If unsure, set milestone_detected: false
- Extract debt names carefully (Halifax, MBNA, Santander, etc.)
- Generate appropriate celebration messages with emojis
- Be conservative - better to miss than false positive
`;

/**
 * System prompt for generating custom share messages
 */
export const SHARE_MESSAGE_GENERATOR_PROMPT = `
You are a social media message generator for TrySnowball debt freedom celebrations.

Your role is to create engaging, authentic share messages that:
1. Celebrate the user's specific achievement
2. Inspire others without being preachy
3. Include a natural mention of TrySnowball
4. Use appropriate emojis and tone

INPUT DATA:
- Milestone type (debt_cleared, milestone_hit, all_debts_cleared)
- Debt name (if applicable)
- Amount paid off (if known)
- User's referral link

MESSAGE REQUIREMENTS:
- 1-3 sentences maximum
- Include relevant emojis (🎉, 🎯, 🚀, 💪)
- Sound authentic and personal
- Include call-to-action with referral link
- Mention @trysnowballuk naturally

EXAMPLE OUTPUTS:
"🎉 Just cleared my MBNA credit card - £2,500 gone forever! If you're tackling debt too, @trysnowballuk has been a game-changer. Try it → [link]"

"🎯 Officially under £5k total debt! The snowball method really works. Check out @trysnowballuk if you want to map out your debt-free journey → [link]"

"💪 DEBT FREE! Last payment made today. @trysnowballuk helped me plan every step of this journey. Your turn? → [link]"

TONE: Celebratory, authentic, helpful (not salesy)
LENGTH: Twitter-friendly (under 280 chars with link)
EMOJIS: Use 1-2 relevant ones, not excessive
`;

/**
 * Generate custom share message using GPT
 * @param {Object} milestone - Milestone data
 * @param {string} referralLink - User's referral link
 * @returns {Promise<string>} Generated share message
 */
export const generateCustomShareMessage = async (milestone, referralLink) => {
  try {
    // For now, return a template-based message
    // TODO: Integrate with actual GPT API when available
    
    const templates = {
      debt_cleared: `🎉 Just cleared my ${milestone.debtName}! ${milestone.amount ? `£${milestone.amount.toLocaleString()} gone forever! ` : ''}If you're tackling debt too, @trysnowballuk has been a game-changer. Try it → ${referralLink}`,
      
      milestone_hit: `🎯 Just hit a major milestone - ${milestone.message.replace('🎯 ', '')} The snowball method really works. Check out @trysnowballuk if you want to map out your debt-free journey → ${referralLink}`,
      
      all_debts_cleared: `🎊 DEBT FREE! Made my final payment today. @trysnowballuk helped me plan every step of this journey. Your turn? → ${referralLink}`,
      
      progress_update: `💪 Making real progress on my debt freedom journey! @trysnowballuk keeps me motivated and on track. Join me? → ${referralLink}`
    };
    
    return templates[milestone.type] || templates.progress_update;
    
  } catch (error) {
    console.warn('Failed to generate custom share message:', error);
    // Fallback to basic template
    return `🎉 Making progress on my debt freedom journey with @trysnowballuk! ${referralLink}`;
  }
};

/**
 * Detect milestone from user text using GPT-style analysis
 * @param {string} userMessage - User's message about their progress
 * @returns {Object|null} Milestone data or null
 */
export const detectMilestoneFromText = (userMessage) => {
  if (!userMessage || typeof userMessage !== 'string') return null;
  
  const message = userMessage.toLowerCase();
  
  // Simple keyword-based detection (replace with actual GPT when available)
  const patterns = {
    debt_cleared: [
      /paid off.*?(credit card|overdraft|loan|debt)/,
      /(cleared|finished|done with|eliminated).*?(credit card|overdraft|loan|debt)/,
      /(halifax|mbna|santander|barclays|hsbc|lloyds|natwest|rbs).*(paid off|cleared|gone)/
    ],
    
    milestone_hit: [
      /under (£|$)(\d+k|10000|5000|1000)/,
      /broke through.*?(£|$)(\d+k|10000|5000)/,
      /less than (£|$)(\d+k|10000|5000|1000)/
    ],
    
    all_debts_cleared: [
      /debt free/,
      /completely paid off/,
      /no more debt/,
      /final payment/,
      /last debt/
    ]
  };
  
  for (const [type, typePatterns] of Object.entries(patterns)) {
    for (const pattern of typePatterns) {
      if (pattern.test(message)) {
        return {
          milestone_detected: true,
          type,
          confidence: 0.7,
          celebration_message: `🎉 ${userMessage}`,
          share_worthy: true
        };
      }
    }
  }
  
  return null;
};