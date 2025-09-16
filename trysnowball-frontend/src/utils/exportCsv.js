/**
 * CSV Export Utilities
 * Client-side only, Unicode-safe, Excel-compatible
 */

/**
 * Convert array of objects to CSV string
 * Handles nested objects, arrays, and special characters properly
 */
export function toCsv(rows) {
  if (!rows?.length) return '';
  
  // Get all unique columns from all rows
  const cols = [...new Set(rows.flatMap(r => Object.keys(r || {})))];
  
  // Escape function for CSV values
  const esc = (value) => {
    if (value == null) return '';
    const str = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Create header row
  const header = cols.join(',');
  
  // Create data rows
  const dataRows = rows.map(row => 
    cols.map(col => esc(row[col])).join(',')
  );
  
  return [header, ...dataRows].join('\n');
}

/**
 * Download CSV file with proper filename and Excel compatibility
 */
export function downloadCsv(filename, csvContent) {
  // Add BOM for proper Excel UTF-8 support
  const blob = new Blob([`\uFEFF${csvContent}`], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateFilename(baseName) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  return `${baseName}_${dateStr}.csv`;
}

/**
 * Format currency for CSV export
 */
export function formatCurrency(amount, currency = 'GBP') {
  if (typeof amount !== 'number' || isNaN(amount)) return '0.00';
  
  // Format as number with 2 decimal places, no currency symbols for CSV
  return amount.toFixed(2);
}

/**
 * Format date for CSV export (ISO format for consistency)
 */
export function formatDate(date) {
  if (!date) return '';
  
  try {
    if (typeof date === 'string') {
      return new Date(date).toISOString().split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return String(date);
  } catch (error) {
    return String(date);
  }
}