/**
 * History Table Parser
 * Parses CSV-like input into payment history entries
 */

export function parseHistoryTable(rawInput) {
 if (!rawInput || typeof rawInput !== 'string') {
  return [];
 }

 const lines = rawInput.trim().split('\n');
 const entries = [];

 for (const line of lines) {
  const trimmedLine = line.trim();
  if (!trimmedLine || trimmedLine.startsWith('#')) {
   continue; // Skip empty lines and comments
  }

  const [dateStr, amountStr] = trimmedLine.split(',');
  if (!dateStr || !amountStr) {
   continue; // Skip malformed lines
  }

  const date = parseDate(dateStr.trim());
  const amount = parseFloat(amountStr.trim());

  if (date && !isNaN(amount)) {
   entries.push({
    date,
    amount,
    balance: amount // For backward compatibility
   });
  }
 }

 // Sort by date (oldest first)
 return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
}

function parseDate(dateStr) {
 // Try common date formats
 const formats = [
  // "June 2024", "Jun 2024"
  /^([A-Za-z]+)\s+(\d{4})$/,
  // "2024-06", "06-2024" 
  /^(\d{4})-(\d{1,2})$/,
  /^(\d{1,2})-(\d{4})$/,
  // "2024/06/01"
  /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/
 ];

 for (const format of formats) {
  const match = dateStr.match(format);
  if (match) {
   try {
    return new Date(dateStr).toISOString().split('T')[0];
   } catch {
    continue;
   }
  }
 }

 // Fallback: try native Date parsing
 try {
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
   return parsed.toISOString().split('T')[0];
  }
 } catch {
  // Ignore
 }

 return null;
}