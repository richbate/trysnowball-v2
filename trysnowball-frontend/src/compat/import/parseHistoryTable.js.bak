/**
 * Parse pasted balance history tables into snapshot objects
 * Supports various date and balance formats
 */

/**
 * Parse a month/year string into ISO date
 * @param {string} dateStr - e.g. "June 2024", "Jun 24", "06/2024", "2024-06"
 * @returns {string} ISO date string
 */
function parseMonthYear(dateStr) {
 if (!dateStr) throw new Error('Missing date');
 
 // Clean the input
 const cleaned = dateStr.trim();
 
 // Try various date formats
 let date;
 
 // Format: "June 2024" or "Jun 2024"
 if (/^[A-Za-z]+ \d{4}$/.test(cleaned)) {
  date = new Date(Date.parse(cleaned + ' 1'));
 }
 // Format: "06/2024" or "6/2024"
 else if (/^\d{1,2}\/\d{4}$/.test(cleaned)) {
  const [month, year] = cleaned.split('/');
  date = new Date(year, parseInt(month) - 1, 1);
 }
 // Format: "2024-06" or "2024/06"
 else if (/^\d{4}[-\/]\d{1,2}$/.test(cleaned)) {
  const [year, month] = cleaned.split(/[-\/]/);
  date = new Date(year, parseInt(month) - 1, 1);
 }
 // Format: "01/06/2024" or "1/6/2024" (DD/MM/YYYY)
 else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
  const [day, month, year] = cleaned.split('/');
  date = new Date(year, parseInt(month) - 1, parseInt(day));
 }
 // Format: "2024-06-01" (ISO)
 else if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
  date = new Date(cleaned);
 }
 else {
  // Try parsing as-is
  date = new Date(Date.parse(cleaned));
 }
 
 if (isNaN(date.getTime())) {
  throw new Error(`Cannot parse date: ${dateStr}`);
 }
 
 return date.toISOString();
}

/**
 * Parse a balance string into a number
 * @param {string} balanceStr - e.g. "2,200.00", "£2200", "$2,200"
 * @returns {number}
 */
function parseBalance(balanceStr) {
 if (!balanceStr) throw new Error('Missing balance');
 
 // Remove currency symbols, spaces, and commas
 const cleaned = balanceStr
  .replace(/[£$€¥]/g, '')
  .replace(/,/g, '')
  .replace(/\s/g, '')
  .trim();
 
 const balance = parseFloat(cleaned);
 
 if (isNaN(balance)) {
  throw new Error(`Cannot parse balance: ${balanceStr}`);
 }
 
 return balance;
}

/**
 * Parse a CSV/TSV style table of balance history
 * @param {string} input - Raw text input from user
 * @param {string} debtId - ID of the debt these snapshots belong to
 * @returns {Array} Array of snapshot objects
 */
export function parseHistoryTable(input, debtId) {
 if (!input || !input.trim()) {
  throw new Error('No data provided');
 }
 
 if (!debtId) {
  throw new Error('Debt ID is required');
 }
 
 const lines = input.trim().split('\n').filter(line => line.trim());
 
 if (lines.length === 0) {
  throw new Error('No data found');
 }
 
 const snapshots = [];
 const errors = [];
 
 for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Skip header rows
  if (i === 0 && /^(date|month|period)/i.test(line)) {
   continue;
  }
  
  // Split by comma, tab, or multiple spaces
  const parts = line.split(/[,\t]| +/).map(p => p.trim()).filter(p => p);
  
  if (parts.length < 2) {
   errors.push(`Line ${i + 1}: Expected date and balance, got: "${line}"`);
   continue;
  }
  
  try {
   // First part is date, second is balance
   // Some formats might have balance first, so we try to detect
   let dateStr, balanceStr;
   
   // Check if first part looks like a number/currency
   if (/^[£$€¥\d]/.test(parts[0])) {
    balanceStr = parts[0];
    dateStr = parts[1];
   } else {
    dateStr = parts[0];
    balanceStr = parts[1];
   }
   
   const timestamp = parseMonthYear(dateStr);
   const balance = parseBalance(balanceStr);
   
   snapshots.push({
    id: `snapshot_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    debtId: debtId,
    balance: balance,
    timestamp: timestamp,
    eventType: 'adjustment'
   });
  } catch (err) {
   errors.push(`Line ${i + 1}: ${err.message}`);
  }
 }
 
 if (snapshots.length === 0) {
  const errorMsg = errors.length > 0 
   ? `Failed to parse any valid entries:\n${errors.join('\n')}`
   : 'No valid data found. Please check the format.';
  throw new Error(errorMsg);
 }
 
 // Sort by date (oldest first)
 snapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
 
 // If there were some errors but we got some valid data, we can proceed
 if (errors.length > 0) {
  console.warn('Some lines could not be parsed:', errors);
 }
 
 return snapshots;
}

/**
 * Generate example data for testing
 */
export function generateExampleData() {
 return `June 2024,2200
July 2024,2100
August 2024,1950
September 2024,1800
October 2024,1650
November 2024,1500`;
}