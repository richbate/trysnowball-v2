/**
 * AI Intent Router
 * Routes user messages to appropriate actions instead of defaulting to debt updates
 */

/**
 * Parse user intent from message text
 * @param {string} userText - The user's message
 * @returns {object} - Parsed intent with action and parameters
 */
export function parseUserIntent(userText) {
  if (!userText || typeof userText !== 'string') {
    return { action: 'UNKNOWN', text: userText };
  }

  const text = userText.trim().toLowerCase();
  
  // Data reset intents
  if (/(clear|reset|wipe|delete).*(data|everything|all)/i.test(text)) {
    return { 
      action: 'RESET_DATA',
      confirmed: /confirm.*reset|reset.*confirm/i.test(text),
      factoryReset: /factory.*reset|complete.*reset|total.*reset/i.test(text)
    };
  }
  
  // Debt management intents
  if (/(add|create).*(debt|loan|card)/i.test(text)) {
    return { action: 'ADD_DEBT' };
  }
  
  if (/(update|change|modify).*(debt|balance|payment)/i.test(text)) {
    return { action: 'UPDATE_DEBT' };
  }
  
  if (/(remove|delete|paid.*off).*(debt)/i.test(text)) {
    return { action: 'REMOVE_DEBT' };
  }
  
  // Progress and tracking intents
  if (/(show|display|track).*(progress|status|summary)/i.test(text)) {
    return { action: 'SHOW_PROGRESS' };
  }
  
  // Strategy and coaching intents
  if (/(help|advice|strategy|plan|what.*should)/i.test(text)) {
    return { action: 'COACH' };
  }
  
  // Greeting intents
  if (/^(hi|hello|hey|good\s+(morning|afternoon|evening))/i.test(text)) {
    return { action: 'GREETING' };
  }
  
  // Default to coaching if we can't determine intent
  return { 
    action: 'COACH',
    fallback: true 
  };
}

/**
 * Route parsed intent to appropriate handler
 * @param {object} intent - Parsed intent object
 * @param {object} context - User and app context
 * @returns {Promise<object>} - Handler response
 */
export async function routeIntent(intent, context) {
  const { action } = intent;
  
  try {
    switch (action) {
      case 'RESET_DATA':
        const { handleResetDataCommand } = await import('./resetUserData.js');
        return await handleResetDataCommand(intent, context);
        
      case 'ADD_DEBT':
        return {
          success: false,
          message: "To add a debt, please use the 'Add Debt' button or describe your debt details (name, balance, minimum payment)."
        };
        
      case 'UPDATE_DEBT':
        return {
          success: false,
          message: "To update a debt, please specify which debt and what you'd like to change (e.g., 'Update Credit Card 1 balance to £1,500')."
        };
        
      case 'REMOVE_DEBT':
        return {
          success: false,
          message: "To remove a debt, please specify which one (e.g., 'Remove Credit Card 1' or mark it as paid off)."
        };
        
      case 'SHOW_PROGRESS':
        return {
          success: true,
          message: "Check your 'My Progress' page to see your debt elimination timeline and milestones!"
        };
        
      case 'GREETING':
        return {
          success: true,
          message: `Hello! I'm your AI debt coach. I can help with debt strategies, progress tracking, and motivation. What would you like to work on?`
        };
        
      case 'COACH':
      default:
        // Let this fall through to normal GPT coaching
        return null;
    }
    
  } catch (error) {
    console.error('Intent routing error:', error);
    return {
      success: false,
      message: "I couldn't process that request. Please try rephrasing or check the Help section."
    };
  }
}

/**
 * Main intent processing function
 * @param {string} userText - User's message
 * @param {object} context - User and app context  
 * @returns {Promise<object|null>} - Response object or null to continue with normal GPT
 */
export async function processUserIntent(userText, context = {}) {
  // Parse the user's intent
  const intent = parseUserIntent(userText);
  
  // Route to appropriate handler
  const response = await routeIntent(intent, context);
  
  // Return response or null to continue with normal GPT processing
  return response;
}

export default { parseUserIntent, routeIntent, processUserIntent };