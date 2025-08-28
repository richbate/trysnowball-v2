/**
 * Safe Message Renderer
 * CSP-compliant message processing without eval or string evaluation
 */

/**
 * Safely process and render message content without string evaluation
 * @param {string} content - Raw message content
 * @returns {Object} Safe rendered content
 */
export function safeRenderMessage(content) {
  if (!content) return { text: '', formatted: false };
  
  // Ensure content is a string
  const safeContent = String(content);
  
  // Simple markdown-like formatting without eval
  // This replaces dangerous dynamic evaluation with safe string manipulation
  const formatted = safeContent
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />')
    // Links (safe URL parsing)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      // Validate URL to prevent XSS
      if (isValidUrl(url)) {
        return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
      }
      return match;
    });
  
  return {
    text: safeContent,
    html: formatted,
    formatted: true
  };
}

/**
 * Safely escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Validate URL without using regex execution
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely without eval
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} Parsed object or null
 */
export function safeParse(jsonString) {
  try {
    // Use native JSON.parse which is CSP-safe
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Safe parse failed:', error);
    return null;
  }
}

/**
 * Process AI response safely
 * @param {any} response - AI response
 * @returns {Object} Safe processed response
 */
export function processAIResponse(response) {
  // Handle different response types safely
  if (typeof response === 'string') {
    return {
      type: 'text',
      content: safeRenderMessage(response),
      raw: response
    };
  }
  
  if (response && typeof response === 'object') {
    // Don't use eval or new Function to process object
    return {
      type: 'structured',
      content: response,
      raw: JSON.stringify(response)
    };
  }
  
  return {
    type: 'unknown',
    content: { text: 'Invalid response format', formatted: false },
    raw: String(response)
  };
}