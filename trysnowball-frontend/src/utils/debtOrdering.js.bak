/**
 * Debt ordering utilities for strategy-based automatic ordering
 */

/**
 * Auto-assign order_index based on strategy when not provided
 * @param {Object} newDebt - The new debt to assign order to
 * @param {Array} existingDebts - Array of existing debts 
 * @param {string} strategy - 'snowball', 'avalanche', or 'custom'
 * @returns {number} - The calculated order_index (0-based)
 */
export function calculateAutoOrder(newDebt, existingDebts = [], strategy = 'snowball') {
 // If no existing debts, start at 0
 if (!existingDebts.length) return 0;
 
 // Create array of all debts including the new one for sorting
 const allDebts = [...existingDebts, newDebt];
 
 // Sort based on strategy
 let sortedDebts;
 
 if (strategy === 'snowball') {
  // Snowball: Smallest balance first
  sortedDebts = allDebts.sort((a, b) => {
   const aBalance = a.amount_pennies || 0;
   const bBalance = b.amount_pennies || 0;
   return aBalance - bBalance;
  });
 } else if (strategy === 'avalanche') {
  // Avalanche: Highest interest rate first
  sortedDebts = allDebts.sort((a, b) => {
   const aRate = a.apr || 0;
   const bRate = b.apr || 0;
   return bRate - aRate; // Descending for avalanche
  });
 } else {
  // Custom or unknown: Add at end
  return existingDebts.length;
 }
 
 // Find the new debt's position in the sorted array
 const newDebtIndex = sortedDebts.findIndex(debt => debt === newDebt);
 return newDebtIndex;
}

/**
 * Re-order all debts according to strategy
 * Useful for applying strategy-based ordering to existing debts
 * @param {Array} debts - Array of debts to reorder
 * @param {string} strategy - 'snowball', 'avalanche', or 'custom'
 * @returns {Array} - Debts with updated order_index values
 */
export function reorderByStrategy(debts, strategy = 'snowball') {
 if (!debts.length) return debts;
 
 let sortedDebts;
 
 if (strategy === 'snowball') {
  // Snowball: Smallest balance first
  sortedDebts = [...debts].sort((a, b) => {
   const aBalance = a.amount_pennies || 0;
   const bBalance = b.amount_pennies || 0;
   return aBalance - bBalance;
  });
 } else if (strategy === 'avalanche') {
  // Avalanche: Highest interest rate first 
  sortedDebts = [...debts].sort((a, b) => {
   const aRate = a.apr || 0;
   const bRate = b.apr || 0;
   return bRate - aRate; // Descending for avalanche
  });
 } else {
  // Custom: Keep existing order or sort by current order_index
  sortedDebts = [...debts].sort((a, b) => {
   const aOrder = Number.isFinite(a.order_index) ? a.order_index : 999;
   const bOrder = Number.isFinite(b.order_index) ? b.order_index : 999;
   return aOrder - bOrder;
  });
 }
 
 // Assign sequential order_index values
 return sortedDebts.map((debt, index) => ({
  ...debt,
  order_index: index
 }));
}